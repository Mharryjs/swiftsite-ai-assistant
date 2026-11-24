import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminAudit, users } from "@/db/schema";
import { getCurrentUser, isOwnerUser } from "@/lib/auth";

export async function PATCH(request: Request) {
  const owner = await getCurrentUser();
  if (!isOwnerUser(owner)) return Response.json({ error: "Owner only." }, { status: 403 });
  const body = await request.json() as { userId?: string; isBlocked?: boolean; dailyLimit?: number };
  if (!body.userId) return Response.json({ error: "Choose a user." }, { status: 400 });
  const [target] = await db.select().from(users).where(eq(users.id, body.userId)).limit(1);
  if (!target) return Response.json({ error: "User not found." }, { status: 404 });
  if (target.isOwner) return Response.json({ error: "Owner accounts cannot be changed here." }, { status: 403 });
  const updates: { isBlocked?: boolean; dailyLimit?: number } = {};
  if (typeof body.isBlocked === "boolean") updates.isBlocked = body.isBlocked;
  if (typeof body.dailyLimit === "number" && Number.isInteger(body.dailyLimit) && body.dailyLimit >= 1 && body.dailyLimit <= 2000) updates.dailyLimit = body.dailyLimit;
  if (!Object.keys(updates).length) return Response.json({ error: "No valid changes." }, { status: 400 });
  const [changed] = await db.update(users).set(updates).where(eq(users.id, body.userId)).returning();
  await db.insert(adminAudit).values({ actorId: owner!.id, action: "user.update", detail: JSON.stringify({ userId: changed.id, ...updates }) });
  return Response.json({ ok: true, user: { id: changed.id, isBlocked: changed.isBlocked, dailyLimit: changed.dailyLimit } });
}
