import { eq } from "drizzle-orm";
import { readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { db } from "@/db";
import { generations } from "@/db/schema";
import { getCurrentUser, isOwnerUser } from "@/lib/auth";
import { MEDIA_DIR } from "@/lib/generate";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const user = await getCurrentUser();
  if (!user) return new Response("Sign in first.", { status: 401 });

  const [row] = await db.select().from(generations).where(eq(generations.id, id)).limit(1);
  if (!row) return new Response("Not found.", { status: 404 });
  if (row.userId !== user.id && !isOwnerUser(user)) return new Response("Not found.", { status: 404 });

  if (row.status !== "done") {
    return new Response(row.status === "failed" ? row.error ?? "Generation failed." : `Still working: ${row.progress ?? row.status}`, {
      status: 409, headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  if (row.kind === "code") {
    const html = row.html ?? "<!doctype html><title>Empty</title>";
    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Security-Policy": "sandbox allow-scripts allow-forms; default-src 'none'; img-src data: blob: https:; style-src 'unsafe-inline' https:; font-src data: https:; script-src 'unsafe-inline';",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  if (!row.fileName) return new Response("File missing.", { status: 404 });
  try {
    const bytes = await readFile(path.join(MEDIA_DIR, path.basename(row.fileName)));
    const download = new URL(request.url).searchParams.get("download");
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": row.mime,
        "Content-Length": String(bytes.length),
        "Cache-Control": "private, max-age=3600",
        "Accept-Ranges": "none",
        ...(download ? { "Content-Disposition": `attachment; filename="swiftsite-${row.kind}-${row.id.slice(0, 8)}${row.mime === "video/mp4" ? ".mp4" : row.mime === "image/png" ? ".png" : ".jpg"}"` } : {}),
      },
    });
  } catch {
    return new Response("File missing.", { status: 404 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in first." }, { status: 401 });

  const [row] = await db.select().from(generations).where(eq(generations.id, id)).limit(1);
  if (!row || (row.userId !== user.id && !isOwnerUser(user))) {
    return Response.json({ error: "Not found." }, { status: 404 });
  }
  await db.delete(generations).where(eq(generations.id, id));
  if (row.fileName) {
    try {
      await unlink(path.join(MEDIA_DIR, path.basename(row.fileName)));
    } catch { /* file already gone */ }
  }
  return Response.json({ ok: true });
}
