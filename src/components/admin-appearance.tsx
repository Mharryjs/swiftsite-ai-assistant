"use client";

import { useEffect, useState } from "react";

type Config = { name: string; accent: string; font: string };
export default function AdminAppearance() {
  const [config, setConfig] = useState<Config>({ name: "SwiftSite Assistant", accent: "#3e8f26", font: "Outfit" });
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { fetch("/api/app-config", { cache: "no-store" }).then(res => res.json()).then((data: Config) => setConfig(data)).catch(() => {}); }, []);
  async function save() {
    setBusy(true); setStatus("");
    try {
      const res = await fetch("/api/app-config", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config) });
      const data = await res.json() as Config & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed.");
      setConfig(data); setStatus("Saved to PostgreSQL. Connected apps will update automatically.");
      window.dispatchEvent(new Event("focus"));
    } catch (error) { setStatus(error instanceof Error ? error.message : "Save failed."); }
    finally { setBusy(false); }
  }
  return <section className="glass mt-5 rounded-3xl p-5"><h2 className="text-base font-bold text-leaf-950">Live appearance</h2><p className="mt-1 text-xs text-leaf-950/60">Saved values apply on refresh and sync to open apps every 20 seconds. Changes are audited.</p><div className="mt-3 grid gap-3 sm:grid-cols-3"><label className="auth-field">App name<input value={config.name} onChange={e => setConfig({ ...config, name: e.target.value })}/></label><label className="auth-field">Accent colour<input type="color" value={config.accent} onChange={e => setConfig({ ...config, accent: e.target.value })}/></label><label className="auth-field">Body font<select value={config.font} onChange={e => setConfig({ ...config, font: e.target.value })}>{["Outfit", "Manrope", "Plus Jakarta Sans", "Inter Variable"].map(font => <option key={font}>{font}</option>)}</select></label></div><button disabled={busy} onClick={() => void save()} className="btn btn-primary mt-3">{busy ? "Saving…" : "Save appearance"}</button>{status && <p role="status" className="mt-2 text-xs text-leaf-800">{status}</p>}</section>;
}
