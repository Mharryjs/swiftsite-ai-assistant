"use client";

import { useState } from "react";

type Person = { id: string; name: string; email: string; isOwner: boolean; isBlocked: boolean; dailyLimit: number; chatCount: number; fileCount: number };
export default function AdminUsers({ initial }: { initial: Person[] }) {
  const [people, setPeople] = useState(initial);
  const [error, setError] = useState("");
  async function update(id: string, patch: { isBlocked?: boolean; dailyLimit?: number }) {
    const res = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: id, ...patch }) });
    const data = await res.json() as { error?: string; user?: { isBlocked: boolean; dailyLimit: number } };
    if (!res.ok || !data.user) { setError(data.error ?? "Could not save user."); return; }
    setError(""); setPeople(prev => prev.map(p => p.id === id ? { ...p, ...data.user } : p));
  }
  return <div className="glass rounded-3xl p-5">
    <h3 className="text-sm font-bold text-leaf-950">Accounts & permissions</h3>
    <p className="mt-1 text-xs text-leaf-950/60">Changes are enforced immediately on new chat requests.</p>
    {error && <p role="alert" className="auth-error mt-2">{error}</p>}
    <div className="mt-3 space-y-2">{people.map(person => <div key={person.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/50 px-3 py-2">
      <div className="min-w-0"><p className="truncate text-sm font-semibold text-leaf-950">{person.name}{person.isOwner ? " · owner" : ""}</p><p className="truncate text-[.68rem] text-leaf-950/60">{person.email} · {person.chatCount} chats · {person.fileCount} files</p></div>
      {!person.isOwner && <div className="flex items-center gap-2"><label className="text-[.65rem] text-leaf-900">Daily limit <input aria-label={`Daily limit for ${person.email}`} type="number" min={1} max={2000} defaultValue={person.dailyLimit} onBlur={e => { const value = Number(e.target.value); if (value !== person.dailyLimit) void update(person.id, { dailyLimit: value }); }} className="ml-1 w-14 rounded-md border border-white bg-white/80 px-1 py-1"/></label><button onClick={() => void update(person.id, { isBlocked: !person.isBlocked })} className="btn btn-ghost !text-xs">{person.isBlocked ? "Unblock" : "Block"}</button></div>}
    </div>)}</div>
  </div>;
}
