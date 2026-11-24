import { NextResponse } from "next/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { POST as streamPost } from "./stream/route";
import type { LanguagePref } from "@/lib/ai";
import { ensureSettings, getCurrentUser, workspaceForUser } from "@/lib/auth";
import { resolveProvider } from "@/lib/providers";
import { buildSiteForPrompt, isSiteRequest } from "@/lib/site-builder";
import { generations } from "@/db/schema";

export const runtime = "nodejs";
export const maxDuration = 90;

const modes = new Set(["assistant", "developer", "writer", "translator", "analyst", "tutor"]);

async function scope(guestWorkspace: string | null) {
  const user = await getCurrentUser();
  if (user) {
    const settings = await ensureSettings(user.id);
    return { user, workspaceId: workspaceForUser(user), language: settings.language as LanguagePref };
  }
  return { user: null, workspaceId: guestWorkspace, language: "auto" as LanguagePref };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const wanted = url.searchParams.get("provider");
  const guest = url.searchParams.get("workspaceId");
  const conversationId = url.searchParams.get("conversationId");
  const { workspaceId, user } = await scope(guest && /^[a-zA-Z0-9_-]{6,96}$/.test(guest) ? guest : null);

  if (!workspaceId && !user) return NextResponse.json({ error: "Sign in or start a guest workspace." }, { status: 400 });
  if (wanted === "1") {
    const provider = await resolveProvider();
    return NextResponse.json({
      provider: provider.provider === "none" ? "SwiftSite AI" : `SwiftSite AI · ${provider.provider === "openai" ? "ChatGPT" : provider.provider === "gemini" ? "Gemini" : provider.provider}`,
      connected: provider.provider !== "none",
      model: provider.model,
    });
  }

  if (conversationId) {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, conversationId), eq(conversations.workspaceId, workspaceId ?? "")))
      .limit(1);
    if (!conversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    const items = await db.select().from(messages).where(eq(messages.conversationId, conversation.id)).orderBy(asc(messages.createdAt));
    return NextResponse.json({ conversation, messages: items });
  }

  const items = await db
    .select()
    .from(conversations)
    .where(eq(conversations.workspaceId, workspaceId ?? ""))
    .orderBy(desc(conversations.updatedAt))
    .limit(40);
  return NextResponse.json({ conversations: items });
}

export async function POST(request: Request) {
  const response = await streamPost(request);
  if (!response.ok || !response.body) {
    return NextResponse.json({ error: (await response.json().catch(() => ({})) as { error?: string }).error ?? "AI request failed." }, { status: response.status });
  }
  const lines = (await response.text()).split("\n").filter(Boolean);
  let message = "";
  let conversationId: string | undefined;
  let provider = "AI";
  let error: { message?: string; status?: number } | null = null;
  let artifact: { url: string; title: string } | undefined;
  for (const line of lines) {
    try {
      const item = JSON.parse(line) as { type: string; text?: string; conversationId?: string; provider?: string; message?: string; status?: number; artifact?: { url: string; title: string } };
      if (item.type === "delta") message += item.text ?? "";
      if (item.conversationId) conversationId = item.conversationId;
      if (item.provider) provider = item.provider;
      if (item.type === "done") artifact = item.artifact;
      if (item.type === "error") error = { message: item.message, status: item.status };
    } catch { /* ignore malformed transport line */ }
  }
  if (error || !message.trim()) return NextResponse.json({ error: error?.message ?? "AI provider returned no answer.", conversationId, partial: message || undefined }, { status: error?.status && error.status >= 400 && error.status < 600 ? error.status : 503 });
  return NextResponse.json({ conversationId, message, provider, artifact });
}
