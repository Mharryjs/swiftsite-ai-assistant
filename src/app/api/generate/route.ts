import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { generations } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { MEDIA_DIR, applyFilter, generateAiVideo, generateImage, generateWebsite, imageFilters, loadUpload, type ImageFilter } from "@/lib/generate";

export const runtime = "nodejs";
export const maxDuration = 300;

async function processJob(id: string, kind: string, prompt: string, imageApiKey: string | null, sourceFile: string | null, seconds: number, filter: ImageFilter) {
  try {
    if (kind === "code") {
      await db.update(generations).set({ status: "working", progress: "Writing the HTML…" }).where(eq(generations.id, id));
      const site = await generateWebsite(prompt);
      await db.update(generations).set({
        status: "done", progress: "Ready", html: site.html, source: site.source,
        fileName: `${randomUUID().slice(0, 8)}.html`, mime: "text/html", meta: { bytes: Buffer.byteLength(site.html) },
      }).where(eq(generations.id, id));
      return;
    }

    await db.update(generations).set({ status: "working", progress: kind === "video" ? "Requesting AI video provider…" : "Generating image…" }).where(eq(generations.id, id));
    await mkdir(MEDIA_DIR, { recursive: true });
    if (kind === "image") {
      const uploaded = sourceFile ? await loadUpload(sourceFile) : null;
      const image = uploaded
        ? { buffer: await (await import("sharp")).default(await applyFilter(uploaded, filter)).png().toBuffer(), source: `Edited uploaded image · ${filter}`, mime: "image/png" }
        : await generateImage(prompt, imageApiKey);
      const ext = image.mime === "image/png" ? "png" : "jpg";
      const fileName = `${randomUUID()}.${ext}`;
      await writeFile(path.join(MEDIA_DIR, fileName), image.buffer);
      await db.update(generations).set({
        status: "done", progress: "Ready", fileName, mime: image.mime, source: image.source,
        meta: { bytes: image.buffer.length },
      }).where(eq(generations.id, id));
      return;
    }

    if (sourceFile) throw new Error("Reference-image video is not supported by the connected video provider. Try a text prompt instead; your upload was not used.");
    const video = await generateAiVideo(prompt, imageApiKey, seconds);
    const fileName = `${randomUUID()}.mp4`;
    await writeFile(path.join(MEDIA_DIR, fileName), video);
    await db.update(generations).set({
      status: "done", progress: "Ready", fileName, mime: "video/mp4",
      source: "Pollinations AI video", meta: { bytes: video.length, seconds },
    }).where(eq(generations.id, id));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed.";
    console.error("generation job failed", id, error);
    await db.update(generations).set({ status: "failed", error: message, progress: null }).where(eq(generations.id, id));
  }
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");

  if (id) {
    const [row] = await db.select().from(generations).where(and(eq(generations.id, id), eq(generations.userId, user.id))).limit(1);
    if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({
      id: row.id, kind: row.kind, status: row.status, progress: row.progress, error: row.error,
      prompt: row.prompt, source: row.source, locked: row.source === "locked",
      url: row.status === "done" ? `/api/media/${row.id}` : null,
      meta: row.meta,
    });
  }

  const rows = await db.select({
    id: generations.id, kind: generations.kind, prompt: generations.prompt, source: generations.source,
    status: generations.status, progress: generations.progress, createdAt: generations.createdAt,
  }).from(generations).where(eq(generations.userId, user.id)).orderBy(desc(generations.createdAt)).limit(36);
  return NextResponse.json({ items: rows });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in to generate.", hint: "login" }, { status: 401 });

  try {
    const body = (await request.json()) as { kind?: string; prompt?: string; sourceFile?: string; duration?: number; filter?: string };
    const kind = body.kind ?? "image";
    const prompt = (body.prompt ?? "").trim();
    if (!["image", "video", "code"].includes(kind)) return NextResponse.json({ error: "Unknown generation type." }, { status: 400 });
    const sourceFile = typeof body.sourceFile === "string" && body.sourceFile.startsWith("upload-") ? body.sourceFile : null;
    const seconds = body.duration === 5 ? 5 : 10;
    const filter: ImageFilter = imageFilters.includes((body.filter ?? "none") as ImageFilter) ? (body.filter as ImageFilter) ?? "none" : "none";
    if (!sourceFile && (prompt.length < 3 || prompt.length > 1200)) return NextResponse.json({ error: "Write a prompt between 3 and 1200 characters." }, { status: 400 });
    if (sourceFile && kind === "code") return NextResponse.json({ error: "Uploads are for images and video only." }, { status: 400 });
    if (!sourceFile && filter !== "none") return NextResponse.json({ error: "Upload an image first to apply a filter." }, { status: 400 });

    if ((kind === "video" || (kind === "image" && !sourceFile)) && !user.imageApiKey) {
      return NextResponse.json({ error: `${kind === "video" ? "AI video" : "AI image"} generation requires an active Pollinations key with credits. Add it in owner settings. No file was created.` }, { status: 422 });
    }
    if (kind === "video" && sourceFile) return NextResponse.json({ error: "This video provider cannot use a private uploaded reference image. Use a text prompt instead." }, { status: 422 });

    const [row] = await db.insert(generations).values({
      userId: user.id, kind, status: "queued", progress: "Queued…", prompt,
      source: "pending", mime: kind === "code" ? "text/html" : kind === "video" ? "video/mp4" : "image/png",
      inputFile: sourceFile,
    }).returning();

    // Long jobs run outside the request so the browser never waits on a slow render.
    void processJob(row.id, kind, prompt, user.imageApiKey, sourceFile, seconds, filter);

    return NextResponse.json({ id: row.id, kind, status: "queued", progress: "Queued…" }, { status: 202 });
  } catch (error) {
    console.error("generation could not start", error);
    return NextResponse.json({ error: "Could not start that job." }, { status: 500 });
  }
}
