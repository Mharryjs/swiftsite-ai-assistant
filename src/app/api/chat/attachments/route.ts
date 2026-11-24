import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/db";
import { attachments } from "@/db/schema";
import { getCurrentUser, workspaceForUser } from "@/lib/auth";
import { MEDIA_DIR } from "@/lib/generate";

export const runtime = "nodejs";
const allowed = new Set([
  "image/png", "image/jpeg", "image/webp", "image/gif", "video/mp4", "video/webm",
  "text/plain", "text/markdown", "text/csv", "text/html", "text/css", "text/javascript",
  "application/json", "application/javascript", "application/pdf", "application/xml",
]);
async function identity(request: Request) {
  const user = await getCurrentUser();
  const guest = new URL(request.url).searchParams.get("workspaceId") ?? request.headers.get("x-workspace-id");
  const workspaceId = user ? workspaceForUser(user) : guest;
  return workspaceId && /^[a-zA-Z0-9_-]{6,96}$/.test(workspaceId) ? { user, workspaceId } : null;
}

export async function POST(request: Request) {
  const auth = await identity(request);
  if (!auth) return Response.json({ error: "Invalid workspace." }, { status: 401 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ error: "Choose a file." }, { status: 400 });
    const mime = file.type || "text/plain";
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const isCode = ["js", "jsx", "ts", "tsx", "py", "sql", "xml", "yaml", "yml", "md", "txt", "css", "html", "csv", "json"].includes(ext);
    if (!allowed.has(mime) && !isCode) return Response.json({ error: "Supported: images, MP4/WebM video, PDF, text and code files." }, { status: 415 });
    if (file.size < 1 || file.size > 8 * 1024 * 1024) return Response.json({ error: "File must be under 8 MB." }, { status: 413 });
    const bytes = Buffer.from(await file.arrayBuffer());
    const fileName = `chat-${randomUUID()}`;
    await mkdir(MEDIA_DIR, { recursive: true });
    await writeFile(path.join(MEDIA_DIR, fileName), bytes);
    const [item] = await db.insert(attachments).values({
      workspaceId: auth.workspaceId, userId: auth.user?.id ?? null,
      name: file.name.slice(0, 240), mime: isCode && !allowed.has(mime) ? "text/plain" : mime,
      bytes: String(bytes.length), fileName,
    }).returning();
    return Response.json({ id: item.id, name: item.name, mime: item.mime, bytes: bytes.length, url: `/api/chat/attachments?id=${item.id}&workspaceId=${auth.workspaceId}` });
  } catch {
    return Response.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const auth = await identity(request);
  if (!auth) return new Response("Not authorised.", { status: 401 });
  const id = new URL(request.url).searchParams.get("id") ?? "";
  const [item] = await db.select().from(attachments).where(and(eq(attachments.id, id), eq(attachments.workspaceId, auth.workspaceId))).limit(1);
  if (!item) return new Response("Not found.", { status: 404 });
  try {
    const file = await readFile(path.join(MEDIA_DIR, item.fileName));
    return new Response(new Uint8Array(file), { headers: { "Content-Type": item.mime, "Content-Length": item.bytes, "Content-Disposition": `inline; filename="${item.name.replace(/["\r\n]/g, "")}"`, "Cache-Control": "private, no-store" } });
  } catch { return new Response("File unavailable.", { status: 404 }); }
}

export async function DELETE(request: Request) {
  const auth = await identity(request);
  if (!auth) return Response.json({ error: "Not authorised." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id") ?? "";
  const [item] = await db.select().from(attachments).where(and(eq(attachments.id, id), eq(attachments.workspaceId, auth.workspaceId))).limit(1);
  if (!item) return Response.json({ error: "Not found." }, { status: 404 });
  await db.delete(attachments).where(eq(attachments.id, id));
  await unlink(path.join(MEDIA_DIR, item.fileName)).catch(() => {});
  return Response.json({ ok: true });
}
