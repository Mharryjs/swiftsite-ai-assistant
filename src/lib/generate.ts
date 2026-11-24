import { createHash, randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";
import ffmpegStatic from "ffmpeg-static";
import { openRealAiStream } from "@/lib/real-ai";

const run = promisify(execFile);
export const MEDIA_DIR = path.join(process.cwd(), ".data", "media");

const palettes: Array<[string, string, string]> = [
  ["#0b2412", "#1f6b3a", "#aee28a"],
  ["#10261f", "#0f7a63", "#9ef0c8"],
  ["#2a1c0b", "#a5661a", "#f5d79a"],
  ["#151a33", "#3f4f9e", "#c6d0ff"],
  ["#2a0f1c", "#8d2f4f", "#ffc2d3"],
  ["#0e2230", "#20708f", "#b6ecff"],
];

export const imageFilters = ["none", "mono", "warm", "cool", "vivid", "soft"] as const;
export type ImageFilter = (typeof imageFilters)[number];

function hashOf(text: string) {
  const hex = createHash("sha256").update(text).digest("hex");
  return { hex, ints: Array.from({ length: 10 }, (_, i) => parseInt(hex.slice(i * 4, i * 4 + 4), 16)) };
}

/** Draws a real artwork for the prompt with sharp — no external service needed. */
export async function designArtwork(prompt: string, width = 1280, height = 720): Promise<Buffer> {
  const { ints, hex } = hashOf(prompt);
  const warm = /(sunset|desert|gold|autumn|warm|fire|coffee)/i.test(prompt);
  const cool = /(night|moon|space|ocean|water|ice|sky)/i.test(prompt);
  const palette = warm ? palettes[2] : cool ? palettes[5] : palettes[ints[0] % palettes.length];
  const [dark, mid, light] = palette;
  const blobs = Array.from({ length: 7 }, (_, i) => {
    const x = ints[i] % width;
    const y = ints[(i + 3) % 10] % height;
    const r = 120 + (ints[(i + 5) % 10] % 330);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${i % 2 ? light : mid}" opacity="${(0.18 + ((ints[i] % 30) / 100)).toFixed(2)}"/>`;
  }).join("");
  const rings = Array.from({ length: 9 }, (_, i) => `<circle cx="${width * 0.62}" cy="${height * 0.45}" r="${90 + i * (34 + (ints[i % 10] % 18))}" fill="none" stroke="${light}" stroke-opacity="${(0.28 - i * 0.025).toFixed(2)}" stroke-width="1.5"/>`).join("");
  const wave = Array.from({ length: 40 }, (_, i) => {
    const y = height * 0.55 + Math.sin(i / 4 + ints[1] / 9000) * 90 + i * 4;
    return `${i === 0 ? "M" : "L"}${((i / 39) * width).toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <linearGradient id="base" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${dark}"/><stop offset="1" stop-color="${mid}"/></linearGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="${light}" stop-opacity="0.55"/><stop offset="1" stop-color="${light}" stop-opacity="0"/></radialGradient>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="0.13"/></feComponentTransfer></filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#base)"/>
  <circle cx="${width * 0.7}" cy="${height * 0.3}" r="${width * 0.42}" fill="url(#glow)"/>
  ${blobs}${rings}
  <path d="${wave}" fill="none" stroke="${light}" stroke-opacity="0.4" stroke-width="2"/>
  <rect width="${width}" height="${height}" filter="url(#grain)" opacity="0.5"/>
  <text x="64" y="${height - 64}" font-family="Georgia, serif" font-size="30" fill="${light}" opacity="0.9">${hex.slice(0, 6).toUpperCase()}</text>
</svg>`;
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

async function aiImage(prompt: string, apiKey?: string | null): Promise<Buffer | null> {
  try {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt.slice(0, 600))}?width=1280&height=576&nologo=true&seed=${Math.floor(Math.random() * 999999)}${apiKey ? `&model=flux` : ""}`;
    const res = await fetch(url, { headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {}, signal: AbortSignal.timeout(apiKey ? 45_000 : 26_000), cache: "no-store" });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 5000 || buffer[0] !== 0xff) return null;
    return buffer;
  } catch {
    return null;
  }
}

export async function generateImage(prompt: string, apiKey?: string | null): Promise<{ buffer: Buffer; source: string; mime: string }> {
  if (!apiKey) throw new Error("Image generation needs a Pollinations API key with credits. Add it in Settings. No image was generated.");
  const url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt.slice(0, 600))}?model=flux&width=1024&height=576`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(90_000), cache: "no-store" });
  if (!res.ok) throw new Error(`Image provider returned ${res.status}: ${(await res.text()).slice(0, 250)}`);
  const mime = res.headers.get("content-type") ?? "";
  if (!mime.startsWith("image/")) throw new Error("Image provider returned an invalid file.");
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 1000) throw new Error("Image provider returned an empty image.");
  return { buffer, source: "Pollinations image", mime };
}

export async function generateAiVideo(prompt: string, apiKey: string | null, seconds: number): Promise<Buffer> {
  if (!apiKey) throw new Error("AI video requires a Pollinations key with Pollen credits. Add it in Settings. No video was generated.");
  const url = `https://gen.pollinations.ai/video/${encodeURIComponent(prompt.slice(0, 600))}?model=bytedance%2Fseedance-2.0&duration=${seconds === 5 ? 5 : 10}&aspectRatio=16%3A9`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(240_000), cache: "no-store" });
  if (!res.ok) throw new Error(`Video provider returned ${res.status}: ${(await res.text()).slice(0, 250)}`);
  const mime = res.headers.get("content-type") ?? "";
  if (!mime.includes("video/")) throw new Error("Video provider returned an invalid video file.");
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length < 5000) throw new Error("Video provider returned an empty file.");
  return bytes;
}

export function applyFilter(buffer: Buffer, filter: ImageFilter): Promise<Buffer> {
  const image = sharp(buffer).rotate();
  switch (filter) {
    case "mono": return image.grayscale().linear(1.05, -6).toBuffer();
    case "warm": return image.recomb([[1.06, 0, 0], [0, 1.01, 0], [0, 0, 0.92]]).modulate({ saturation: 1.08 }).toBuffer();
    case "cool": return image.recomb([[0.94, 0, 0], [0, 1.02, 0], [0, 0, 1.09]]).modulate({ saturation: 1.02 }).toBuffer();
    case "vivid": return image.modulate({ saturation: 1.35, brightness: 1.04 }).linear(1.08, -8).toBuffer();
    case "soft": return image.blur(1.4).modulate({ saturation: 0.92, brightness: 1.05 }).toBuffer();
    default: return image.toBuffer();
  }
}

export async function loadUpload(fileName: string): Promise<Buffer | null> {
  try {
    const safe = path.basename(fileName);
    if (!safe.startsWith("upload-")) return null;
    return await readFile(path.join(MEDIA_DIR, safe));
  } catch {
    return null;
  }
}

export function resolveFfmpeg(): string | null {
  const candidates = [
    process.env.FFMPEG_PATH,
    typeof ffmpegStatic === "string" ? ffmpegStatic : null,
    "/app/node_modules/ffmpeg-static/ffmpeg",
    "/usr/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
  ].filter((value): value is string => Boolean(value));
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

/** Encodes a real MP4 (5 or 10 seconds) from the artwork, with motion, colour shift and fades. */
export async function renderVideo(prompt: string, artwork: Buffer, seconds = 10): Promise<Buffer> {
  const ffmpeg = resolveFfmpeg();
  if (!ffmpeg) throw new Error("The video renderer binary is missing on this server.");
  const duration = seconds === 5 ? 5 : 10;
  await mkdir(MEDIA_DIR, { recursive: true });
  const stamp = randomUUID();
  const pngPath = path.join(MEDIA_DIR, `${stamp}.png`);
  const mp4Path = path.join(MEDIA_DIR, `${stamp}.mp4`);
  const wide = await sharp(artwork).resize(1280, 720, { fit: "cover" }).png().toBuffer();
  await writeFile(pngPath, wide);
  const filter = [
    "scale=1600:-1",
    `zoompan=z='1.02+${(0.7 / (duration * 25)).toFixed(6)}*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${duration * 25}:s=1280x720:fps=25`,
    `hue=h='12*sin(2*PI*t/${duration})':s='1+0.12*sin(2*PI*t/${Math.max(3, duration - 2)})'`,
    "fade=t=in:st=0:d=0.8",
    `fade=t=out:st=${(duration - 1).toFixed(2)}:d=1`,
    "format=yuv420p",
  ].join(",");
  await run(ffmpeg, [
    "-y", "-loop", "1", "-i", pngPath, "-t", String(duration), "-r", "25",
    "-vf", filter, "-c:v", "libx264", "-preset", "veryfast", "-crf", "26",
    "-movflags", "+faststart", "-an", mp4Path,
  ], { timeout: 150_000 });
  const mp4 = await readFile(mp4Path);
  await Promise.all([unlink(pngPath).catch(() => {}), unlink(mp4Path).catch(() => {})]);
  void prompt;
  return mp4;
}

/** Builds a complete, real website that follows the user's prompt. */
export async function generateWebsite(request: string): Promise<{ html: string; source: string }> {
  const prompt = `Build a complete original responsive single-file HTML website for this request: ${request}\nReturn ONLY <!DOCTYPE html> through </html>, with embedded CSS and vanilla JavaScript, no markdown. Match requested colours, layout and content. Use 3D only if asked. Do not add irrelevant sections.`;
  const upstream = await openRealAiStream([{ role: "user", content: prompt }], "developer", "english");
  let html = "";
  try { for await (const chunk of upstream.chunks) html += chunk; }
  finally { upstream.abort(); }
  html = html.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/, "").trim();
  if (!/<!doctype html>/i.test(html) || !/<html[\s>]/i.test(html) || !/<\/html>/i.test(html) || !/<style[\s>]/i.test(html) || html.length < 400) {
    throw new Error("The model did not produce a complete HTML website. Please retry with a shorter prompt.");
  }
  return { html, source: upstream.provider };
}
