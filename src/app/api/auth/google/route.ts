import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { loginEvents, userSettings, users } from "@/db/schema";
import { OWNER_EMAIL, createSession, ensureSettings } from "@/lib/auth";

export const runtime = "nodejs";

const STATE_COOKIE = "swiftsite_oauth_state";
const scopes = ["openid", "email", "profile"].join(" ");

function redirectUri(request: Request) {
  return process.env.GOOGLE_REDIRECT_URI ?? new URL("/api/auth/google", request.url).toString();
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/login?error=google_not_configured", request.url));
  }

  const code = url.searchParams.get("code");
  if (!code) {
    const state = randomBytes(16).toString("hex");
    const jar = await cookies();
    jar.set(STATE_COOKIE, state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600, secure: process.env.NODE_ENV === "production" });
    const authorize = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authorize.searchParams.set("client_id", clientId);
    authorize.searchParams.set("redirect_uri", redirectUri(request));
    authorize.searchParams.set("response_type", "code");
    authorize.searchParams.set("scope", scopes);
    authorize.searchParams.set("state", state);
    authorize.searchParams.set("prompt", "select_account");
    return NextResponse.redirect(authorize);
  }

  const jar = await cookies();
  const expected = jar.get(STATE_COOKIE)?.value;
  if (!expected || expected !== url.searchParams.get("state")) {
    return NextResponse.redirect(new URL("/login?error=state_mismatch", request.url));
  }
  jar.delete(STATE_COOKIE);

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri(request),
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return NextResponse.redirect(new URL("/login?error=google_token", request.url));
  const tokens = (await tokenRes.json()) as { access_token?: string };
  if (!tokens.access_token) return NextResponse.redirect(new URL("/login?error=google_token", request.url));

  const profileRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileRes.ok) return NextResponse.redirect(new URL("/login?error=google_profile", request.url));
  const profile = (await profileRes.json()) as { sub: string; email?: string; name?: string; picture?: string; email_verified?: boolean };
  if (!profile.email || profile.email_verified === false) {
    return NextResponse.redirect(new URL("/login?error=email_unverified", request.url));
  }

  const email = profile.email.toLowerCase();
  const userAgent = request.headers.get("user-agent");
  // A verified Google address must not create a new owner account automatically.
  // The existing owner's role is assigned by the database, never by a string match.
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  let userId: string;
  if (existing) {
    userId = existing.id;
    await db.update(users).set({
      googleId: profile.sub,
      avatarUrl: profile.picture ?? existing.avatarUrl,
      lastLoginAt: new Date(),
      isOwner: existing.isOwner,
    }).where(eq(users.id, existing.id));
  } else {
    const [created] = await db.insert(users).values({
      email,
      name: profile.name?.slice(0, 80) ?? email.split("@")[0],
      googleId: profile.sub,
      avatarUrl: profile.picture,
      isOwner: false,
      lastLoginAt: new Date(),
    }).returning();
    userId = created.id;
    await db.insert(userSettings).values({ userId }).onConflictDoNothing();
  }

  await ensureSettings(userId);
  await db.insert(loginEvents).values({
    userId,
    method: "google",
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent,
  });
  await createSession(userId, userAgent);
  return NextResponse.redirect(new URL("/dashboard", request.url));
}
