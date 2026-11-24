import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { conversations, messages, users } from "@/db/schema";
import { getCurrentUser, isOwnerUser } from "@/lib/auth";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = { title: "Conversation" };
export const dynamic = "force-dynamic";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getCurrentUser();
  if (!viewer) redirect(`/login?next=/dashboard/chat/${id}`);

  const [row] = await db
    .select({ conversation: conversations, email: users.email, name: users.name })
    .from(conversations)
    .leftJoin(users, eq(users.id, conversations.userId))
    .where(eq(conversations.id, id))
    .limit(1);
  if (!row) notFound();
  if (row.conversation.userId !== viewer.id && !isOwnerUser(viewer)) notFound();

  const transcript = await db
    .select({ id: messages.id, role: messages.role, content: messages.content, provider: messages.provider, createdAt: messages.createdAt })
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt));

  return <div className="min-h-dvh">
    <SiteHeader />
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link className="text-xs font-semibold text-leaf-800 underline underline-offset-2" href="/dashboard">← Back to dashboard</Link>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-leaf-950 sm:text-3xl">{row.conversation.title}</h1>
      <p className="mt-1 text-xs text-leaf-950/55">{row.email ?? "guest"} · {row.conversation.mode} · {transcript.length} messages</p>
      <div className="mt-6 space-y-3">
        {transcript.map((message) => <article className={`glass rounded-2xl p-4 ${message.role === "user" ? "sm:ml-10" : "sm:mr-10"}`} key={message.id}>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[0.68rem] font-bold uppercase tracking-wide text-leaf-700">{message.role}</span>
            <span className="text-[0.62rem] text-leaf-950/45">{message.provider ?? ""}</span>
          </div>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-leaf-950/80">{message.content}</p>
        </article>)}
      </div>
    </main>
  </div>;
}
