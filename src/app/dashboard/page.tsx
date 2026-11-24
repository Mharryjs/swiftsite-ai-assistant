import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { adminAudit, aiRequests, conversations, generations, loginEvents, messages, users } from "@/db/schema";
import AdminUsers from "@/components/admin-users";
import { ensureSettings, getCurrentUser, isOwnerUser } from "@/lib/auth";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = { title: "Dashboard", description: "Your chats, generated files and account overview." };
export const dynamic = "force-dynamic";

const when = (date: Date | string | null) => {
  if (!date) return "—";
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(value);
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");
  const owner = isOwnerUser(user);
  const settings = await ensureSettings(user.id);

  const [{ mine: myChats } = { mine: 0 }] = await db
    .select({ mine: count() })
    .from(conversations)
    .where(eq(conversations.userId, user.id));
  const [{ mine: myMedia } = { mine: 0 }] = await db
    .select({ mine: count() })
    .from(generations)
    .where(eq(generations.userId, user.id));
  const [{ messages: myMessages } = { messages: 0 }] = await db
    .select({ messages: count() })
    .from(messages)
    .innerJoin(conversations, eq(conversations.id, messages.conversationId))
    .where(eq(conversations.userId, user.id));

  const myRecentChats = await db
    .select({
      id: conversations.id, title: conversations.title, mode: conversations.mode,
      updatedAt: conversations.updatedAt,
      messageCount: sql<number>`(select count(*)::int from ${messages} where ${messages.conversationId} = ${conversations.id})`,
    })
    .from(conversations)
    .where(eq(conversations.userId, user.id))
    .orderBy(desc(conversations.updatedAt))
    .limit(8);

  const myFiles = await db
    .select({ id: generations.id, kind: generations.kind, prompt: generations.prompt, source: generations.source, createdAt: generations.createdAt })
    .from(generations)
    .where(eq(generations.userId, user.id))
    .orderBy(desc(generations.createdAt))
    .limit(6);

  const ownerData = owner ? await (async () => {
    const [{ total: totalUsers } = { total: 0 }] = await db.select({ total: count() }).from(users);
    const [{ total: totalChats } = { total: 0 }] = await db.select({ total: count() }).from(conversations);
    const [{ total: totalFiles } = { total: 0 }] = await db.select({ total: count() }).from(generations);
    const [{ total: totalMessages } = { total: 0 }] = await db.select({ total: count() }).from(messages);
    const [{ total: totalRequests } = { total: 0 }] = await db.select({ total: count() }).from(aiRequests);
    const dayAgo = new Date(Date.now() - 86_400_000);
    const [{ total: activeToday } = { total: 0 }] = await db.select({ total: count() }).from(users).where(gte(users.lastLoginAt, dayAgo));

    const people = await db
      .select({
        id: users.id, name: users.name, email: users.email, isOwner: users.isOwner,
        isBlocked: users.isBlocked, dailyLimit: users.dailyLimit,
        createdAt: users.createdAt, lastLoginAt: users.lastLoginAt, avatarUrl: users.avatarUrl,
        chatCount: sql<number>`(select count(*)::int from ${conversations} where ${conversations.userId} = ${users.id})`,
        fileCount: sql<number>`(select count(*)::int from ${generations} where ${generations.userId} = ${users.id})`,
      })
      .from(users)
      .orderBy(desc(users.lastLoginAt))
      .limit(40);

    const allChats = await db
      .select({
        id: conversations.id, title: conversations.title, mode: conversations.mode,
        updatedAt: conversations.updatedAt, userId: conversations.userId,
        email: users.email, name: users.name,
        lastQuestion: sql<string | null>`(select ${messages.content} from ${messages} where ${messages.conversationId} = ${conversations.id} and ${messages.role} = 'user' order by ${messages.createdAt} desc limit 1)`,
        messageCount: sql<number>`(select count(*)::int from ${messages} where ${messages.conversationId} = ${conversations.id})`,
      })
      .from(conversations)
      .leftJoin(users, eq(users.id, conversations.userId))
      .orderBy(desc(conversations.updatedAt))
      .limit(25);

    const allFiles = await db
      .select({ id: generations.id, kind: generations.kind, prompt: generations.prompt, source: generations.source, createdAt: generations.createdAt, email: users.email })
      .from(generations)
      .leftJoin(users, eq(users.id, generations.userId))
      .orderBy(desc(generations.createdAt))
      .limit(12);

    const logins = await db
      .select({ id: loginEvents.id, method: loginEvents.method, createdAt: loginEvents.createdAt, email: users.email, name: users.name })
      .from(loginEvents)
      .leftJoin(users, eq(users.id, loginEvents.userId))
      .orderBy(desc(loginEvents.createdAt))
      .limit(12);

    const requests = await db.select().from(aiRequests).orderBy(desc(aiRequests.createdAt)).limit(20);
    const audit = await db.select().from(adminAudit).orderBy(desc(adminAudit.createdAt)).limit(15);
    return { totalUsers, totalChats, totalFiles, totalMessages, totalRequests, activeToday, people, allChats, allFiles, logins, requests, audit };
  })() : null;

  return <div className="min-h-dvh">
    <SiteHeader />
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold tracking-wide text-leaf-700 uppercase">{owner ? "Owner dashboard" : "Your dashboard"}</p>
          <h1 className="mt-2 flex flex-wrap items-center gap-3 text-3xl font-extrabold tracking-tight text-leaf-950 sm:text-4xl">
            {user.avatarUrl ? <Image src={user.avatarUrl} alt="" width={44} height={44} className="h-11 w-11 rounded-full ring-2 ring-white"/> : null}
            {user.name}
            {owner && <span className="tag">owner</span>}
          </h1>
          <div className="mt-4 flex items-center gap-3">
            <Image src="/images/mharryjs.png" alt="Mharryjs" width={44} height={44} className="h-11 w-11 rounded-full border-2 border-white object-cover ring-2 ring-amber-400/70"/>
            <Image src="/images/hiba-avatar.jpg" alt="Hiba Kashif" width={44} height={44} className="h-11 w-11 rounded-full border-2 border-white object-cover ring-2 ring-amber-400/70"/>
            <p className="hand-note">Mharryjs &amp; Hiba — the whole team</p>
          </div>
          <p className="mt-3 text-leaf-950/70">{user.email} · replies in {settings.language === "auto" ? "your language, automatically" : settings.language === "roman-urdu" ? "Roman Urdu" : "English"}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="btn btn-primary" href="/studio">Open studio</Link>
          <Link className="btn btn-ghost" href={owner ? "/admin/settings" : "/settings"}>AI settings</Link>
          <form action="/logout" method="get"><button className="btn btn-ghost" type="submit">Sign out</button></form>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["My conversations", myChats], ["Messages sent", myMessages], ["My generated files", myMedia],
          ["Plan", owner ? "Owner" : "Free"],
        ].map(([label, value]) => <div className="glass rounded-2xl p-4" key={String(label)}>
          <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-leaf-950/50">{label}</p>
          <p className="mt-1 text-2xl font-extrabold text-leaf-950">{value}</p>
        </div>)}
      </div>

      {owner && ownerData && <section className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold tracking-tight text-leaf-950">Everyone on this deployment</h2>
          <p className="hand-note hidden sm:block">real accounts, real questions</p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[["Accounts", ownerData.totalUsers], ["Active in 24h", ownerData.activeToday], ["All conversations", ownerData.totalChats], ["All messages", ownerData.totalMessages], ["AI requests", ownerData.totalRequests], ["Generated files", ownerData.totalFiles]].map(([label, value]) => <div className="glass-strong rounded-2xl p-4" key={String(label)}>
            <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-leaf-950/50">{label}</p>
            <p className="mt-1 text-2xl font-extrabold text-leaf-950">{value}</p>
          </div>)}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <AdminUsers initial={ownerData.people.map(p => ({ id: p.id, name: p.name, email: p.email, isOwner: p.isOwner, isBlocked: p.isBlocked, dailyLimit: p.dailyLimit, chatCount: p.chatCount, fileCount: p.fileCount }))}/>
          <div className="glass rounded-3xl p-5">
            <h3 className="text-sm font-bold text-leaf-950">Accounts</h3>
            <div className="mt-3 space-y-2">
              {ownerData.people.length === 0 && <p className="text-sm text-leaf-950/55">No accounts yet.</p>}
              {ownerData.people.map((person) => <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/50 px-3 py-2" key={person.id}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-leaf-950">{person.name}{person.isOwner ? " · owner" : ""}</p>
                  <p className="truncate text-[0.68rem] text-leaf-950/55">{person.email}</p>
                </div>
                <div className="flex items-center gap-3 text-[0.68rem] text-leaf-950/60">
                  <span>{person.chatCount} chats</span><span>{person.fileCount} files</span><span>{when(person.lastLoginAt)}</span>
                </div>
              </div>)}
            </div>
          </div>

          <div className="glass rounded-3xl p-5">
            <h3 className="text-sm font-bold text-leaf-950">Login activity</h3>
            <div className="mt-3 space-y-2">
              {ownerData.logins.length === 0 && <p className="text-sm text-leaf-950/55">No sign-ins recorded yet.</p>}
              {ownerData.logins.map((event) => <div className="flex items-center justify-between gap-2 rounded-xl bg-white/50 px-3 py-2" key={event.id}>
                <div className="min-w-0"><p className="truncate text-sm font-semibold text-leaf-950">{event.name ?? "Unknown"}</p><p className="truncate text-[0.68rem] text-leaf-950/55">{event.email ?? "—"} · {event.method}</p></div>
                <span className="text-[0.68rem] text-leaf-950/55">{when(event.createdAt)}</span>
              </div>)}
            </div>
          </div>
        </div>

        <div className="glass mt-4 rounded-3xl p-5">
          <h3 className="text-sm font-bold text-leaf-950">What people asked</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[38rem] text-left text-sm">
              <thead><tr className="border-b border-white/70 text-[0.66rem] uppercase tracking-wide text-leaf-950/50"><th className="pb-2 pr-3">User</th><th className="pb-2 pr-3">Conversation</th><th className="pb-2 pr-3">Last question</th><th className="pb-2 pr-3">Msgs</th><th className="pb-2">Updated</th></tr></thead>
              <tbody>
                {ownerData.allChats.length === 0 && <tr><td colSpan={5} className="py-4 text-leaf-950/55">No conversations yet.</td></tr>}
                {ownerData.allChats.map((chat) => <tr className="border-b border-white/40 last:border-0" key={chat.id}>
                  <td className="py-2 pr-3 align-top text-[0.72rem]">{chat.email ?? <span className="text-leaf-950/45">guest</span>}</td>
                  <td className="max-w-[12rem] py-2 pr-3 align-top"><Link className="font-semibold text-leaf-900 underline-offset-2 hover:underline" href={`/dashboard/chat/${chat.id}`}>{chat.title}</Link><p className="text-[0.66rem] capitalize text-leaf-950/50">{chat.mode}</p></td>
                  <td className="max-w-[18rem] py-2 pr-3 align-top text-[0.75rem] text-leaf-950/70"><span className="line-clamp-2">{chat.lastQuestion ?? "—"}</span></td>
                  <td className="py-2 pr-3 align-top text-[0.72rem]">{chat.messageCount}</td>
                  <td className="py-2 align-top text-[0.68rem] text-leaf-950/55">{when(chat.updatedAt)}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass mt-4 rounded-3xl p-5">
          <h3 className="text-sm font-bold text-leaf-950">Recent AI requests and errors</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">{ownerData.requests.map(item => <div className="rounded-xl bg-white/50 p-3" key={item.id}><div className="flex justify-between gap-2"><span className="text-xs font-bold text-leaf-950">{item.status}</span><span className="text-[.65rem] text-leaf-950/55">{when(item.createdAt)}</span></div><p className="mt-1 truncate text-[.68rem] text-leaf-950/65">{item.provider ?? "No model response"} · {item.workspaceId.slice(0, 15)}</p>{item.error && <p className="mt-1 text-[.68rem] text-red-800">{item.error.slice(0, 220)}</p>}</div>)}</div>
          {!ownerData.requests.length && <p className="mt-2 text-xs text-leaf-950/60">No requests recorded yet.</p>}
        </div>
        <div className="glass mt-4 rounded-3xl p-5">
          <h3 className="text-sm font-bold text-leaf-950">Admin audit</h3>
          <div className="mt-2 space-y-2">{ownerData.audit.map(item => <p key={item.id} className="rounded-xl bg-white/50 p-2 text-xs text-leaf-950/70">{when(item.createdAt)} · {item.action} · {item.detail?.slice(0, 180)}</p>)}</div>
          {!ownerData.audit.length && <p className="mt-2 text-xs text-leaf-950/60">No admin changes recorded yet.</p>}
        </div>
        <div className="glass mt-4 rounded-3xl p-5">
          <h3 className="text-sm font-bold text-leaf-950">Latest generated files</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {ownerData.allFiles.length === 0 && <p className="text-sm text-leaf-950/55">Nothing generated yet.</p>}
            {ownerData.allFiles.map((file) => <Link className="flex items-center justify-between gap-2 rounded-xl bg-white/50 px-3 py-2" href={`/api/media/${file.id}`} key={file.id} target="_blank">
              <div className="min-w-0"><p className="truncate text-[0.75rem] font-semibold text-leaf-950">{file.prompt}</p><p className="truncate text-[0.66rem] text-leaf-950/55">{file.email ?? "—"} · {file.source}</p></div>
              <span className="tag shrink-0">{file.kind}</span>
            </Link>)}
          </div>
        </div>
      </section>}

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="glass rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-bold text-leaf-950">My recent conversations</h2><Link className="text-[0.7rem] font-semibold text-leaf-800 underline underline-offset-2" href="/chat">Open chat</Link></div>
          <div className="mt-3 space-y-2">
            {myRecentChats.length === 0 && <p className="rounded-xl bg-white/50 p-4 text-sm text-leaf-950/60">No conversations yet. <Link className="font-semibold text-leaf-800 underline underline-offset-2" href="/chat">Ask the first question</Link>.</p>}
            {myRecentChats.map((chat) => <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/50 px-3 py-2" key={chat.id}>
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-leaf-950">{chat.title}</p><p className="text-[0.66rem] capitalize text-leaf-950/50">{chat.mode} · {chat.messageCount} messages</p></div>
              <span className="text-[0.66rem] text-leaf-950/55">{when(chat.updatedAt)}</span>
            </div>)}
          </div>
        </section>

        <section className="glass rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-bold text-leaf-950">My generated files</h2><Link className="text-[0.7rem] font-semibold text-leaf-800 underline underline-offset-2" href="/studio">Studio</Link></div>
          {myFiles.length === 0 ? <p className="mt-3 rounded-xl bg-white/50 p-4 text-sm text-leaf-950/60">No files yet. Make an image, a 10-second video or a website in the studio.</p> : <div className="mt-3 grid grid-cols-2 gap-2">
            {myFiles.map((file) => <Link className="overflow-hidden rounded-xl bg-white/50" href={`/api/media/${file.id}`} target="_blank" key={file.id}>
              {file.kind === "image" ? <Image src={`/api/media/${file.id}`} alt={file.prompt} width={320} height={180} unoptimized className="h-24 w-full object-cover"/> : <div className="flex h-24 items-center justify-center"><span className="tag">{file.kind === "video" ? "10s MP4" : "HTML site"}</span></div>}
              <p className="line-clamp-2 p-2 text-[0.66rem] leading-snug text-leaf-950/65">{file.prompt}</p>
            </Link>)}
          </div>}
        </section>
      </div>
    </main>
  </div>;
}
