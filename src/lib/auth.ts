import { cookies } from "next/headers";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, userSettings, users, type User } from "@/db/schema";

export const OWNER_EMAIL = "sswiftsite@gmail.com";
export const OWNER_EMAILS = ["sswiftsite@gmail.com", "swiftsite@gmail.com"];
export const SESSION_COOKIE = "swiftsite_session";
const SESSION_DAYS = 30;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string | null) {
  if (!stored || !stored.includes(":")) return false;
  const [salt, expected] = stored.split(":");
  const actual = scryptSync(password, salt, 64);
  const target = Buffer.from(expected, "hex");
  return actual.length === target.length && timingSafeEqual(actual, target);
}

const digest = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string, userAgent: string | null) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.insert(sessions).values({ tokenHash: digest(token), userId, expiresAt, userAgent });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return token;
}

export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, digest(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return row?.user ?? null;
}

export async function destroyCurrentSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, digest(token)));
  jar.delete(SESSION_COOKIE);
}

export async function ensureSettings(userId: string) {
  const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  if (settings) return settings;
  const [created] = await db.insert(userSettings).values({ userId }).returning();
  return created;
}

export const isOwnerUser = (user: User | null) => Boolean(user?.isOwner);
export const workspaceForUser = (user: User) => `u_${user.id}`;
export const publicUser = (user: User) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  avatarUrl: user.avatarUrl,
  isOwner: isOwnerUser(user),
  hasPassword: Boolean(user.passwordHash),
  hasGoogle: Boolean(user.googleId),
  hasImageKey: Boolean(user.imageApiKey),
  createdAt: user.createdAt,
  lastLoginAt: user.lastLoginAt,
});
