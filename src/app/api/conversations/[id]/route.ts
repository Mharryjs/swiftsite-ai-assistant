import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { conversations } from "@/db/schema";
import { getCurrentUser, workspaceForUser } from "@/lib/auth";

async function scoped(request: Request, id: string) {
  const user = await getCurrentUser();
  const guest = request.headers.get("x-workspace-id") ?? new URL(request.url).searchParams.get("workspaceId");
  const workspaceId = user ? workspaceForUser(user) : guest;
  if (!workspaceId) return null;
  const [conversation] = await db.select().from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.workspaceId, workspaceId))).limit(1);
  return conversation ?? null;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await scoped(request, id))) return Response.json({ error: "Not found." }, { status: 404 });
  const body = await request.json() as { title?: string };
  const title = body.title?.trim().slice(0, 180);
  if (!title) return Response.json({ error: "Enter a title." }, { status: 400 });
  await db.update(conversations).set({ title, updatedAt: new Date() }).where(eq(conversations.id, id));
  return Response.json({ ok: true, title });
}
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await scoped(request, id))) return Response.json({ error: "Not found." }, { status: 404 });
  await db.delete(conversations).where(eq(conversations.id, id));
  return Response.json({ ok: true });
}
