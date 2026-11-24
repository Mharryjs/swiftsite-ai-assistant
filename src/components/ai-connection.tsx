"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, PlugZap, Trash2 } from "lucide-react";

type Preset = Record<string, { label: string; baseUrl: string; model: string }>;
  type Info = {
  presets: Preset;
  stored: { provider: string; hasKey: boolean; model: string | null; baseUrl: string | null };
  active: { provider: string; hasKey: boolean; model: string | null; source: string };
  instructions?: string;
};

export default function AiConnection() {
  const [info, setInfo] = useState<Info | null>(null);
  const [provider, setProvider] = useState("gemini");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [instructions, setInstructions] = useState("");
  const [instructionsBusy, setInstructionsBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/providers", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as Info;
    setInfo(data);
    setInstructions(data.instructions ?? "");
    if (data.stored.provider && data.stored.provider !== "none") setProvider(data.stored.provider);
    setModel(data.stored.model ?? "");
    setBaseUrl(data.stored.baseUrl ?? "");
  }

  useEffect(() => { void load(); }, []);

  async function run(action: "save" | "test" | "clear") {
    setBusy(true); setError(""); setMessage("");
    try {
      const res = await fetch("/api/providers", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, provider, apiKey, model, baseUrl }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; reply?: string; saved?: boolean; cleared?: boolean };
      if (!res.ok) throw new Error(data.error ?? "That did not work.");
      if (data.cleared) setMessage("Disconnected. SwiftSite AI is answering again with the built-in engine.");
      else if (data.saved) setMessage(`Saved. Live test reply: “${data.reply ?? ""}”`);
      else setMessage(`Key works. Reply: “${data.reply ?? ""}”`);
      setApiKey("");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That did not work.");
    } finally { setBusy(false); }
  }

  async function saveInstructions() {
    setInstructionsBusy(true); setError(""); setMessage("");
    try {
      const res = await fetch("/api/providers", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "instructions", instructions }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not save.");
      setMessage("Saved — the AI now follows these instructions on every new reply.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save.");
    } finally { setInstructionsBusy(false); }
  }

  const current = info?.presets?.[provider];
  const connected = info?.active.provider !== "none" && info?.active.hasKey;

  return <section className="glass-strong rounded-3xl p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-base font-extrabold text-leaf-950">AI connection · owner</h2>
      <span className={`tag ${connected ? "" : ""}`}>{connected ? `Connected · ${info?.active.provider}` : "SwiftSite AI"}</span>
    </div>
    <p className="mt-2 text-[0.78rem] leading-relaxed text-leaf-950/65">
      Route SwiftSite AI through <strong>Google Gemini</strong>, <strong>ChatGPT (OpenAI)</strong>, Groq or a custom endpoint. Saved credentials stay on the server and are never returned to the browser.
    </p>
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      <label className="auth-field"><span>Provider</span>
        <select value={provider} onChange={(e) => { setProvider(e.target.value); setModel(""); setBaseUrl(""); }}>
          {Object.entries(info?.presets ?? { gemini: { label: "Google Gemini", baseUrl: "", model: "" }, openai: { label: "ChatGPT (OpenAI)", baseUrl: "", model: "" }, groq: { label: "Groq", baseUrl: "", model: "" }, custom: { label: "Custom OpenAI-compatible", baseUrl: "", model: "" } }).map(([id, preset]) => <option key={id} value={id}>{preset.label}</option>)}
        </select>
      </label>
      <label className="auth-field"><span>Model</span><input value={model} onChange={(e) => setModel(e.target.value)} placeholder={current?.model || "model id"}/></label>
      <label className="auth-field sm:col-span-2"><span>API key</span><input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={info?.stored.hasKey ? "A key is saved — paste a new one to replace" : provider === "gemini" ? "AIza…" : "sk-…"} autoComplete="off"/></label>
      {provider === "custom" && <label className="auth-field sm:col-span-2"><span>Base URL</span><input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://your-provider/v1"/></label>}
    </div>
    {info?.active.provider === "gemini" && !info.stored.hasKey && !error && (
      <p className="mt-2 text-[0.7rem] text-leaf-950/55">A Gemini key is already configured on this server through environment variables, so chat is running on Gemini right now.</p>
    )}
    {error && <p className="auth-error mt-3">{error}</p>}
    {message && <p className="mt-3 rounded-xl bg-leaf-100/80 p-3 text-[0.75rem] leading-relaxed text-leaf-900"><Check size={13} className="mr-1 inline"/>{message}</p>}
    <div className="mt-4 flex flex-wrap gap-2">
      <button className="btn btn-primary !text-xs" onClick={() => run("test")} disabled={busy || !apiKey} type="button">{busy ? <Loader2 className="auth-spin" size={14}/> : <PlugZap size={14}/>} Test key</button>
      <button className="btn btn-ghost !text-xs" onClick={() => run("save")} disabled={busy || !apiKey} type="button">Save &amp; use for chat</button>
      {info?.stored.hasKey && <button className="btn btn-ghost !text-xs" onClick={() => run("clear")} disabled={busy} type="button"><Trash2 size={13}/> Disconnect</button>}
    </div>
    <div className="mt-5 border-t border-white/60 pt-4">
      <label className="auth-field"><span>Live AI instructions — applies to every chat instantly</span>
        <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={4} maxLength={4000}
          placeholder="Example: Always answer in Roman Urdu. Keep replies under 5 lines. Mention our weekend discount in every answer."
          className="field min-h-24 resize-y"/>
      </label>
      <button className="btn btn-primary !text-xs mt-2" onClick={saveInstructions} disabled={instructionsBusy} type="button">
        {instructionsBusy ? <Loader2 className="auth-spin" size={14}/> : <Check size={14}/>} Save instructions — live now
      </button>
    </div>
  </section>;
}
