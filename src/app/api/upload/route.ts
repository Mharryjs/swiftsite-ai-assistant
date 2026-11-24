import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { getCurrentUser } from "@/lib/auth";
import { MEDIA_DIR } from "@/lib/generate";

export const runtime = "nodejs";
export const maxDuration = 60;

const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first, then upload your image." }, { status: 401 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image file." }, { status: 400 });
    if (!allowed.has(file.type)) return NextResponse.json({ error: "Use a JPG, PNG, WebP or AVIF image." }, { status: 400 });
    if (file.size > 12 * 1024 * 1024) return NextResponse.json({ error: "Please keep the image under 12 MB." }, { status: 400 });

    const input = Buffer.from(await file.arrayBuffer());
    const normalised = await sharp(input).rotate().resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).png().toBuffer();
    await mkdir(MEDIA_DIR, { recursive: true });
    const fileName = `upload-${randomUUID()}.png`;
    await writeFile(path.join(MEDIA_DIR, fileName), normalised);
    return NextResponse.json({ fileName, bytes: normalised.length, original: file.name });
  } catch {
    return NextResponse.json({ error: "That image could not be read." }, { status: 400 });
  }
}
