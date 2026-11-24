import { and, asc, count, desc, eq, gte, inArray } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/db";
import { aiRequests, attachments, conversations, generations, messages } from "@/db/schema";
import { MEDIA_DIR } from "@/lib/generate";
import type { MediaPart } from "@/lib/real-ai";
import { detectLanguage, type LanguagePref } from "@/lib/ai";
import { ensureSettings, getCurrentUser, workspaceForUser } from "@/lib/auth";
import { AiUpstreamError, openRealAiStream } from "@/lib/real-ai";
import { isSiteRequest } from "@/lib/site-builder";

export const runtime = "nodejs";
export const maxDuration = 120;
const modes = new Set(["assistant", "developer", "writer", "translator", "analyst", "tutor"]);

function websiteRequest(prompt: string) {
  return `Build a complete, original, responsive single-file website for this exact request: ${prompt}\nReturn ONLY a valid <!DOCTYPE html> document with embedded <style> and <script>. No markdown fences, no explanation. Follow the requested colours and sections precisely; use 3D effects only if the user explicitly asks for 3D. Use only HTML, CSS and vanilla JavaScript. Buttons must have real interactions or honest disabled states.`;
}

export async function POST(request: Request) {
  let body: { workspaceId?: string; conversationId?: string; message?: string; mode?: string; attachmentIds?: string[]; regenerate?: boolean };
  try { body = await request.json() as typeof body; }
  catch { return Response.json({ error: "Invalid request body." }, { status: 400 }); }
  const user = await getCurrentUser();
  const workspaceId = user ? workspaceForUser(user) : body.workspaceId;
  if (!workspaceId || !/^[a-zA-Z0-9_-]{6,96}$/.test(workspaceId)) return Response.json({ error: "Invalid workspace." }, { status: 400 });
  if (user?.isBlocked) return Response.json({ error: "This account is suspended. Contact support." }, { status: 403 });
  const startOfDay = new Date(); startOfDay.setUTCHours(0, 0, 0, 0);
  const [{ total }] = await db.select({ total: count() }).from(aiRequests)
    .where(and(eq(aiRequests.workspaceId, workspaceId), gte(aiRequests.createdAt, startOfDay)));
  const limit = user?.isOwner ? 2000 : user?.dailyLimit ?? 40;
  if (total >= limit) return Response.json({ error: `Daily AI request limit reached (${limit}). Try again tomorrow or contact support.` }, { status: 429 });
  let text = body.message?.trim() ?? "";
  const ids = (body.attachmentIds ?? []).filter(id => /^[a-f0-9-]{36}$/i.test(id)).slice(0, 5);
  if ((!text && !ids.length) || text.length > 50_000) return Response.json({ error: "Enter a message or attach up to five files (50,000 character limit)." }, { status: 400 });
  const files = ids.length ? await db.select().from(attachments).where(and(eq(attachments.workspaceId, workspaceId), inArray(attachments.id, ids))) : [];
  if (files.length !== ids.length) return Response.json({ error: "An attachment was not found in your workspace." }, { status: 404 });
  const media: MediaPart[] = [];
  const textFiles: string[] = [];
  for (const file of files) {
    const bytes = await readFile(path.join(MEDIA_DIR, file.fileName)).catch(() => null);
    if (!bytes) return Response.json({ error: `Could not read ${file.name}.` }, { status: 404 });
    if (file.mime.startsWith("image/") || file.mime.startsWith("video/")) {
      media.push({ mime: file.mime, data: bytes.toString("base64") });
    } else if (file.mime === "application/pdf") {
      try {
        const parse = (await import("pdf-parse")).default;
        const result = await parse(bytes);
        if (!result.text.trim()) return Response.json({ error: `${file.name} has no selectable text. Scanned PDFs need OCR.` }, { status: 422 });
        textFiles.push(`[${file.name}]\n${result.text.slice(0, 30000)}`);
      } catch { return Response.json({ error: `Could not extract text from ${file.name}.` }, { status: 422 }); }
    } else textFiles.push(`[${file.name}]\n${bytes.toString("utf8").slice(0, 30000)}`);
  }
  const prompt = [text || "Please describe the attached files.", ...textFiles].join("\n\nAttached document text:\n");
  const mode = body.mode && modes.has(body.mode) ? body.mode : "assistant";
  const [existing] = body.conversationId
    ? await db.select().from(conversations).where(and(eq(conversations.id, body.conversationId), eq(conversations.workspaceId, workspaceId))).limit(1)
    : [];
  if (body.conversationId && !existing) return Response.json({ error: "Conversation not found." }, { status: 404 });
  if (body.regenerate) {
    if (!existing) return Response.json({ error: "Choose a conversation to regenerate." }, { status: 400 });
    const [lastUser] = await db.select().from(messages).where(and(eq(messages.conversationId, existing.id), eq(messages.role, "user"))).orderBy(desc(messages.createdAt)).limit(1);
    if (!lastUser) return Response.json({ error: "No previous user message." }, { status: 400 });
    text = lastUser.content;
  }
  let conversation = existing;
  if (!conversation) {
    [conversation] = await db.insert(conversations).values({ workspaceId, userId: user?.id ?? null, title: text.slice(0, 72), mode }).returning();
  }
  const conversationId = conversation.id;
  const [tracked] = await db.insert(aiRequests).values({ workspaceId, userId: user?.id ?? null, conversationId, status: "pending" }).returning({ id: aiRequests.id });
  if (!body.regenerate) await db.insert(messages).values({ conversationId, role: "user", content: text || `[Attached ${files.map(file => file.name).join(", ")}]` });
  const history = await db.select({ role: messages.role, content: messages.content })
    .from(messages).where(eq(messages.conversationId, conversationId)).orderBy(asc(messages.createdAt));
  const preference = user ? (await ensureSettings(user.id)).language as LanguagePref : "auto";
  const language = detectLanguage(text, preference);
  const building = isSiteRequest(text);
  const turns = history.map(row => ({ role: row.role === "assistant" ? "assistant" as const : "user" as const, content: row.content }));
  turns[turns.length - 1] = { role: "user", content: building ? websiteRequest(prompt) : prompt };
  const encoder = new TextEncoder();
  const event = (type: string, data: Record<string, unknown>) => encoder.encode(JSON.stringify({ type, ...data }) + "\n");

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let upstream: Awaited<ReturnType<typeof openRealAiStream>> | undefined;
      let full = "";
      let closed = false;
      const push = (type: string, data: Record<string, unknown>) => {
        if (!closed) try { controller.enqueue(event(type, data)); } catch { closed = true; }
      };
      const heartbeat = setInterval(() => push("heartbeat", {}), 12000);
      try {
        upstream = await openRealAiStream(turns, mode, language, request.signal, media);
        push("meta", { conversationId, provider: upstream.provider });
        for await (const chunk of upstream.chunks) {
          if (request.signal.aborted) break;
          full += chunk;
          push("delta", { text: chunk });
        }
        if (request.signal.aborted) throw new AiUpstreamError("Generation stopped by user.", 499);
        if (!full.trim()) throw new AiUpstreamError("The provider returned an empty response. Please retry.");
        let artifact: { url: string; title: string } | undefined;
        if (building && user) {
          const code = full.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/, "").trim();
          if (/<!doctype html>/i.test(code) && /<html[\s>]/i.test(code) && /<\/html>/i.test(code) && /<style[\s>]/i.test(code) && code.length > 400) {
            const [file] = await db.insert(generations).values({
              userId: user.id, kind: "code", status: "done", prompt: text, source: upstream.provider,
              mime: "text/html", html: code, fileName: `website-${Date.now()}.html`, meta: { bytes: Buffer.byteLength(code) },
            }).returning();
            artifact = { url: `/api/media/${file.id}`, title: text.slice(0, 80) };
          }
        }
        await db.insert(messages).values({ conversationId, role: "assistant", content: full, provider: upstream.provider });
        await db.update(aiRequests).set({ provider: upstream.provider, status: "done" }).where(eq(aiRequests.id, tracked.id));
        await db.update(conversations).set({ updatedAt: new Date(), mode }).where(eq(conversations.id, conversationId));
        push("done", { conversationId, provider: upstream.provider, artifact });
      } catch (error) {
        const message = error instanceof Error ? error.message : "AI request failed.";
        await db.update(aiRequests).set({ provider: upstream?.provider ?? null, status: request.signal.aborted ? "stopped" : "failed", error: message.slice(0, 500) }).where(eq(aiRequests.id, tracked.id)).catch(() => {});
        if (full.trim()) {
          await db.insert(messages).values({ conversationId, role: "assistant", content: full, provider: upstream?.provider ?? "Interrupted" }).catch(() => {});
        }
        push("error", { conversationId, message, partial: Boolean(full.trim()), status: error instanceof AiUpstreamError ? error.status : 503 });
      } finally {
        clearInterval(heartbeat);
        upstream?.abort();
        if (!closed) try { controller.close(); } catch { /* disconnected */ }
        closed = true;
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store, no-transform", "X-Accel-Buffering": "no" } });
}
