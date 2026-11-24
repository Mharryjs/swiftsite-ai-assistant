import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { loginEvents, userSettings, users } from "@/db/schema";
import {
  OWNER_EMAIL, createSession, destroyCurrentSession, ensureSettings,
  getCurrentUser, hashPassword, isOwnerUser, publicUser, verifyPassword,
} from "@/lib/auth";

export const runtime = "nodejs";

const emailPattern = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null, ownerEmail: OWNER_EMAIL, googleReady: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) });
  const settings = await ensureSettings(user.id);
  return NextResponse.json({
    user: publicUser(user),
    settings: { language: settings.language, defaultMode: settings.defaultMode, imageStyle: settings.imageStyle },
    owner: isOwnerUser(user),
    ownerEmail: OWNER_EMAIL,
    googleReady: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { action?: string; email?: string; password?: string; name?: string };
    const action = body.action ?? "login";

    if (action === "logout") {
      await destroyCurrentSession();
      return NextResponse.json({ ok: true });
    }

    const email = (body.email ?? "").trim().toLowerCase();
    if (action === "signup" && email === OWNER_EMAIL) return NextResponse.json({ error: "This address is reserved for the existing owner account." }, { status: 403 });
    const password = body.password ?? "";
    if (!emailPattern.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

    const userAgent = request.headers.get("user-agent");
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

    if (action === "signup") {
      const name = (body.name ?? "").trim().slice(0, 80) || email.split("@")[0];
      const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
      if (existing) return NextResponse.json({ error: "That email already has an account. Sign in instead." }, { status: 409 });
      const [created] = await db
        .insert(users)
        .values({
          email,
          name,
          passwordHash: hashPassword(password),
          isOwner: false,
          lastLoginAt: new Date(),
        })
        .returning();
      await db.insert(userSettings).values({ userId: created.id }).onConflictDoNothing();
      await db.insert(loginEvents).values({ userId: created.id, method: "email-signup", ip, userAgent });
      await createSession(created.id, userAgent);
      return NextResponse.json({ user: publicUser(created), created: true });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    }
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
    await db.insert(loginEvents).values({ userId: user.id, method: "email", ip, userAgent });
    await ensureSettings(user.id);
    await createSession(user.id, userAgent);
    return NextResponse.json({ user: publicUser(user) });
  } catch (error) {
    console.error("auth failed", error);
    return NextResponse.json({ error: "Could not complete that request." }, { status: 500 });
  }
}
