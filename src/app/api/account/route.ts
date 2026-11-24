import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions, userSettings, users } from "@/db/schema";
import { createSession, ensureSettings, getCurrentUser, hashPassword, publicUser, verifyPassword } from "@/lib/auth";
import { encryptSecret } from "@/lib/providers";

export const runtime = "nodejs";

const allowedLanguages = new Set(["auto", "english", "roman-urdu"]);
const allowedModes = new Set(["assistant", "developer", "writer", "translator", "analyst", "tutor"]);

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const settings = await ensureSettings(user.id);
  return NextResponse.json({ user: publicUser(user), settings });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  try {
    const body = (await request.json()) as {
      name?: string; language?: string; defaultMode?: string; imageStyle?: string; imageApiKey?: string; clearImageKey?: boolean;
      currentPassword?: string; newPassword?: string;
    };

    if (typeof body.newPassword === "string") {
      if (!user.passwordHash) return NextResponse.json({ error: "This account signs in with Google only." }, { status: 400 });
      if (!verifyPassword(body.currentPassword ?? "", user.passwordHash)) {
        return NextResponse.json({ error: "Your current password is not correct." }, { status: 401 });
      }
      if (body.newPassword.length < 8) return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
      await db.update(users).set({ passwordHash: hashPassword(body.newPassword) }).where(eq(users.id, user.id));
      await db.delete(sessions).where(eq(sessions.userId, user.id));
      await createSession(user.id, request.headers.get("user-agent"));
      return NextResponse.json({ ok: true, passwordChanged: true });
    }
    const updates: Record<string, string | null> = {};
    if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim().slice(0, 80);
    if (typeof body.language === "string" && allowedLanguages.has(body.language)) updates.language = body.language;
    if (typeof body.defaultMode === "string" && allowedModes.has(body.defaultMode)) updates.defaultMode = body.defaultMode;
    if (typeof body.imageStyle === "string") updates.imageStyle = body.imageStyle.slice(0, 30);
    if (typeof body.imageApiKey === "string" && body.imageApiKey.trim().length > 5) updates.imageApiKey = body.imageApiKey.trim();
    if (body.clearImageKey) updates.imageApiKey = null;

    if (updates.name) await db.update(users).set({ name: updates.name }).where(eq(users.id, user.id));
    const settingUpdates = {
      ...(updates.language ? { language: updates.language } : {}),
      ...(updates.defaultMode ? { defaultMode: updates.defaultMode } : {}),
      ...(updates.imageStyle ? { imageStyle: updates.imageStyle } : {}),
      updatedAt: new Date(),
    };
    if (Object.keys(settingUpdates).length > 1) {
      await db.update(userSettings).set(settingUpdates).where(eq(userSettings.userId, user.id));
    }
    if (Object.prototype.hasOwnProperty.call(updates, "imageApiKey")) {
      await db.update(users).set({ imageApiKey: updates.imageApiKey ?? null }).where(eq(users.id, user.id));
    }
    const [fresh] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    const settings = await ensureSettings(user.id);
    return NextResponse.json({ ok: true, user: publicUser(fresh), settings });
  } catch (error) {
    console.error("account update failed", error);
    return NextResponse.json({ error: "Could not save those settings." }, { status: 500 });
  }
}
