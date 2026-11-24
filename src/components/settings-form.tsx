"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

type Settings = { language: string; defaultMode: string; imageStyle: string };
type UserInfo = { name: string; email: string; hasImageKey: boolean; isOwner: boolean; hasPassword: boolean; hasGoogle: boolean };

export default function SettingsForm({ user, settings }: { user: UserInfo; settings: Settings }) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [language, setLanguage] = useState(settings.language);
  const [defaultMode, setDefaultMode] = useState(settings.defaultMode);
  const [imageStyle, setImageStyle] = useState(settings.imageStyle);
  const [key, setKey] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [hasKey, setHasKey] = useState(user.hasImageKey);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");

  async function changePassword() {
    setBusy(true); setError(""); setPasswordMsg("");
    try {
      const response = await fetch("/api/account", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not change the password.");
      setPasswordMsg("Password changed. You are signed in on this device.");
      setCurrentPassword(""); setNewPassword("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not change the password.");
    } finally { setBusy(false); }
  }

  async function save(extra: Record<string, unknown> = {}) {
    setBusy(true); setError(""); setSaved("");
    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, language, defaultMode, imageStyle, ...extra }),
      });
      const data = (await response.json()) as { error?: string; user?: { hasImageKey: boolean } };
      if (!response.ok) throw new Error(data.error ?? "Could not save.");
      if (data.user) setHasKey(data.user.hasImageKey);
      setSaved("Saved");
      setKey("");
      router.refresh();
      window.setTimeout(() => setSaved(""), 1800);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
    <section className="glass-strong rounded-[2rem] p-5 sm:p-7">
      <h2 className="text-lg font-extrabold text-leaf-950">Profile &amp; language</h2>
      <div className="mt-4 grid gap-3">
        <label className="auth-field"><span>Display name</span><input value={name} onChange={(e) => setName(e.target.value)} maxLength={80}/></label>
        <label className="auth-field"><span>Reply language</span>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="auto">Auto — mirror whatever I write</option>
            <option value="english">Always English</option>
            <option value="roman-urdu">Always Roman Urdu</option>
          </select>
        </label>
        <label className="auth-field"><span>Default assistant mode</span>
          <select value={defaultMode} onChange={(e) => setDefaultMode(e.target.value)}>
            {["assistant", "developer", "writer", "translator", "analyst", "tutor"].map((m) => <option key={m} value={m}>{m[0].toUpperCase() + m.slice(1)}</option>)}
          </select>
        </label>
        <label className="auth-field"><span>Image style hint</span>
          <select value={imageStyle} onChange={(e) => setImageStyle(e.target.value)}>
            {["cinematic", "editorial", "illustration", "photographic", "minimal"].map((style) => <option key={style} value={style}>{style[0].toUpperCase() + style.slice(1)}</option>)}
          </select>
        </label>
      </div>
      <p className="mt-3 text-[0.72rem] leading-relaxed text-leaf-950/55">
        Auto mirrors your message: Roman Urdu in, Roman Urdu out. English in, English out. This is applied to every reply in the chat.
      </p>
      {error && <p className="auth-error mt-3">{error}</p>}
      <button className="btn btn-primary mt-4" onClick={() => save()} disabled={busy} type="button">
        {busy ? <><Loader2 className="auth-spin" size={15}/> Saving</> : saved ? <><Check size={15}/> {saved}</> : "Save changes"}
      </button>
    </section>

    <div className="grid gap-5">
      <section className="glass rounded-3xl p-5">
        <h2 className="text-base font-extrabold text-leaf-950">Account</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div><dt className="text-[0.7rem] uppercase tracking-wide text-leaf-950/50">Email</dt><dd className="font-semibold text-leaf-950 break-all">{user.email}</dd></div>
          <div><dt className="text-[0.7rem] uppercase tracking-wide text-leaf-950/50">Sign-in methods</dt><dd className="text-leaf-950/75">{user.hasPassword ? "Email + password" : ""}{user.hasPassword && user.hasGoogle ? " · " : ""}{user.hasGoogle ? "Google" : ""}</dd></div>
          <div><dt className="text-[0.7rem] uppercase tracking-wide text-leaf-950/50">Role</dt><dd className="text-leaf-950/75">{user.isOwner ? "Owner — full admin dashboard" : "Member"}</dd></div>
        </dl>
        {user.isOwner && <p className="mt-3 rounded-xl bg-leaf-100/80 p-3 text-[0.72rem] leading-relaxed text-leaf-900">Owner account. The dashboard shows every user, every conversation and every generation.</p>}
      </section>

      <section className="glass rounded-3xl p-5">
        <h2 className="text-base font-extrabold text-leaf-950">Change password</h2>
        <p className="mt-1 text-[0.75rem] leading-relaxed text-leaf-950/60">Salted scrypt hash, stored on the server. Changing it signs out every other device.</p>
        <div className="mt-3 grid gap-2">
          <input className="field !text-xs" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" autoComplete="current-password"/>
          <input className="field !text-xs" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (8+ characters)" autoComplete="new-password"/>
          <button className="btn btn-ghost !text-xs" onClick={changePassword} disabled={busy || !currentPassword || newPassword.length < 8} type="button">Update password</button>
          {passwordMsg && <p className="text-[0.7rem] font-semibold text-leaf-800">{passwordMsg}</p>}
        </div>
      </section>

      <section className="glass rounded-3xl p-5">
        <h2 className="text-base font-extrabold text-leaf-950">Image provider key</h2>
        <p className="mt-1 text-[0.75rem] leading-relaxed text-leaf-950/60">Optional. The studio already works without one using the built-in image engine. A key removes any provider limit.</p>
        <div className="mt-3 flex gap-2">
          <input className="field !text-xs" type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder={hasKey ? "Saved — enter a new key to replace" : "Paste provider key"} autoComplete="off"/>
          <button className="btn btn-ghost !text-xs" onClick={() => save({ imageApiKey: key })} disabled={busy || key.trim().length < 6} type="button">Save</button>
        </div>
        {hasKey && <button className="mt-2 text-[0.7rem] font-semibold text-red-800 underline underline-offset-2" onClick={() => save({ clearImageKey: true })} disabled={busy} type="button">Remove saved key</button>}
        <p className="mt-3 text-[0.68rem] text-leaf-950/45">Stored server-side. It is never sent back to the browser — this page only knows whether a key exists.</p>
      </section>
    </div>
  </div>;
}
