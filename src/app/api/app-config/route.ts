import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminAudit, appSettings } from "@/db/schema";
import { getCurrentUser, isOwnerUser } from "@/lib/auth";

const defaultConfig = { name: "SwiftSite Assistant", accent: "#3e8f26", font: "Outfit" };
const fonts = new Set(["Outfit", "Manrope", "Plus Jakarta Sans", "Inter Variable"]);
export async function GET() {
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, "appearance")).limit(1);
  let config = defaultConfig;
  try { if (row?.value) config = { ...defaultConfig, ...JSON.parse(row.value) as typeof defaultConfig }; } catch { /* use defaults */ }
  return Response.json(config, { headers: { "Cache-Control": "no-store" } });
}
export async function PATCH(request: Request) {
  const owner = await getCurrentUser();
  if (!isOwnerUser(owner)) return Response.json({ error: "Owner only." }, { status: 403 });
  const body = await request.json() as Partial<typeof defaultConfig>;
  const name = (body.name ?? defaultConfig.name).trim().slice(0, 60);
  const accent = body.accent ?? defaultConfig.accent;
  const font = body.font ?? defaultConfig.font;
  if (!name || !/^#[0-9a-f]{6}$/i.test(accent) || !fonts.has(font)) return Response.json({ error: "Enter a name, valid hex colour and supported font." }, { status: 400 });
  const config = { name, accent, font };
  const value = JSON.stringify(config);
  await db.insert(appSettings).values({ key: "appearance", value }).onConflictDoUpdate({ target: appSettings.key, set: { value, updatedAt: new Date() } });
  await db.insert(adminAudit).values({ actorId: owner!.id, action: "appearance.update", detail: value });
  return Response.json({ ok: true, ...config });
}
