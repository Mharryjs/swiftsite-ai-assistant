"use client";

import Image from "next/image";
import { useState } from "react";
import { Code2, Download, Film, ImageIcon, Loader2, Sparkles, Upload, Wand2, X } from "lucide-react";

type Item = { id: string; kind: string; prompt: string; source: string; url?: string; bytes?: number; seconds?: number };

const kinds = [
  { id: "image", label: "Image", icon: ImageIcon, hint: "A real PNG/JPEG file, saved to your account.", placeholder: "A calm green workspace with morning light, cinematic, no text" },
  { id: "video", label: "Video · 10s", icon: Film, hint: "A real 10-second MP4, rendered on the server with ffmpeg.", placeholder: "Slow camera push through a dew-covered leaf, soft green light" },
  { id: "code", label: "HTML/CSS", icon: Code2, hint: "A complete single-file page, written by a real code model.", placeholder: "A one-page portfolio for a photographer, warm cream and green, big serif headline" },
] as const;

export default function Studio({ initialItems, language }: { initialItems: Item[]; language: string }) {
  const [kind, setKind] = useState<"image" | "video" | "code">("image");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [sourceFile, setSourceFile] = useState<string | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [duration, setDuration] = useState<5 | 10>(10);
  const [filter, setFilter] = useState("none");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [items, setItems] = useState<Item[]>(initialItems);
  const [preview, setPreview] = useState<Item | null>(null);

  async function removeItem(id: string) {
    if (!window.confirm("Delete this file permanently?")) return;
    const response = await fetch(`/api/media/${id}`, { method: "DELETE" });
    if (!response.ok) { setError("Could not delete that file."); return; }
    setItems((prev) => prev.filter((item) => item.id !== id));
    setPreview((current) => (current?.id === id ? null : current));
  }
  const active = kinds.find((k) => k.id === kind)!;

  async function uploadImage(file: File) {
    setUploading(true); setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = (await res.json()) as { fileName?: string; error?: string };
      if (!res.ok || !data.fileName) throw new Error(data.error ?? "Upload failed.");
      setSourceFile(data.fileName);
      setSourcePreview(URL.createObjectURL(file));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed.");
    } finally { setUploading(false); }
  }

  async function generate() {
    if (!sourceFile && prompt.trim().length < 3) { setError("Write a slightly longer prompt first, or upload an image."); return; }
    setBusy(true); setError(""); setStatus("Starting…");
    try {
      const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, prompt: prompt || "my uploaded image", sourceFile, duration, filter }) });
      const started = (await response.json()) as { id?: string; error?: string; hint?: string };
      if (!response.ok || !started.id) throw new Error(started.error ?? "Could not start the job.");

      const deadline = Date.now() + 240_000;
      let finished: Item | null = null;
      while (Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 1800));
        const poll = await fetch(`/api/generate?id=${started.id}`, { cache: "no-store" });
        const job = (await poll.json()) as { status?: string; progress?: string; error?: string; url?: string; source?: string; meta?: { bytes?: number } };
        if (!poll.ok) throw new Error(job.error ?? "Could not read the job.");
        if (job.progress) setStatus(job.progress);
        if (job.status === "failed") throw new Error(job.error ?? "Generation failed.");
        if (job.status === "done" && job.url) {
          finished = { id: started.id, kind, prompt, source: job.source ?? "Generated", url: job.url, bytes: job.meta?.bytes, seconds: kind === "video" ? 10 : undefined };
          break;
        }
      }
      if (!finished) throw new Error("This is taking longer than usual. Check the project list in a minute — it will appear there when it finishes.");
      setItems((prev) => [finished as Item, ...prev]);
      setPreview(finished);
      setPrompt(""); setSourceFile(null); setSourcePreview(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Generation failed.");
    } finally {
      setStatus(""); setBusy(false);
    }
  }

  const shown = items.filter((item) => item.kind === kind);

  return <div className="grid gap-5">
    <section className="glass-strong rounded-[2rem] p-5 sm:p-7">
      <div className="flex flex-wrap gap-2">
        {kinds.map((option) => <button key={option.id} onClick={() => { setKind(option.id); setError(""); }} className={`studio-tab ${kind === option.id ? "active" : ""}`} type="button"><option.icon size={15}/>{option.label}</button>)}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-leaf-950/60">{active.hint}{kind !== "code" ? " You can also upload your own image and use it as the base." : ""}</p>
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} className="field mt-4 resize-y leading-relaxed" placeholder={active.placeholder} disabled={busy}/>
      {kind === "video" && <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-leaf-950/50">Length</span>
        {[5, 10].map((value) => <button key={value} type="button" onClick={() => setDuration(value as 5 | 10)}
          className={`studio-tab ${duration === value ? "active" : ""}`}>{value} seconds</button>)}
      </div>}
      {kind !== "code" && <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-leaf-950/50">Image filter</span>
        {["none", "mono", "warm", "cool", "vivid", "soft"].map((name) => <button key={name} type="button" onClick={() => setFilter(name)}
          className={`studio-tab capitalize ${filter === name ? "active" : ""}`}>{name}</button>)}
      </div>}
      {kind !== "code" && <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className={`btn btn-ghost !text-xs cursor-pointer ${uploading ? "opacity-60" : ""}`}>
          <Upload size={14}/> {uploading ? "Uploading…" : sourceFile ? "Replace my image" : "Upload my image"}
          <input type="file" accept="image/*" className="hidden" disabled={uploading || busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file); event.target.value = ""; }}/>
        </label>
        {sourcePreview && <span className="flex items-center gap-2 rounded-full bg-white/60 p-1 pr-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sourcePreview} alt="Your uploaded image" className="h-7 w-7 rounded-full object-cover"/>
          <span className="text-[0.68rem] font-semibold text-leaf-900">using your image</span>
          <button type="button" onClick={() => { setSourceFile(null); setSourcePreview(null); }} aria-label="Remove uploaded image"><X size={13}/></button>
        </span>}
      </div>}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.7rem] text-leaf-950/50">{language === "roman-urdu" ? "Roman Urdu ya English — dono chalega." : "English or Roman Urdu — both are fine."}</p>
        <button className="btn btn-primary" onClick={generate} disabled={busy} type="button">{busy ? <><Loader2 className="auth-spin" size={16}/>{status || "Working…"}</> : <><Wand2 size={16}/> Generate {kind === "video" ? "10s video" : kind === "code" ? "website" : sourceFile ? "from my image" : "image"}</>}</button>
      </div>
      {error && <p className="auth-error mt-3">{error}</p>}
      <p className="mt-3 text-[0.68rem] leading-relaxed text-leaf-950/45">
        AI image and AI video require a Pollinations key with credits in Settings. Uploaded photos can be edited with real filters. Only successful provider files are shown as generated; provider errors remain visible.
      </p>
    </section>

    {preview && <section className="glass rounded-[2rem] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold text-leaf-950">Latest result</h2><span className="tag">{preview.source}</span></div>
      <div className="mt-3 overflow-hidden rounded-2xl bg-white/50">
        {preview.kind === "image" && preview.url && <Image src={preview.url} alt={preview.prompt} width={1280} height={720} unoptimized className="w-full"/>}
        {preview.kind === "video" && preview.url && <video src={preview.url} controls autoPlay loop playsInline className="w-full"/>}
        {preview.kind === "code" && preview.url && <iframe src={preview.url} title="Generated website preview" className="h-[28rem] w-full bg-white" sandbox="allow-scripts allow-forms"/>}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a className="btn btn-primary !text-xs" href={`${preview.url}?download=${preview.kind === "code" ? "html" : "1"}`}><Download size={14}/> Download {preview.kind === "code" ? "HTML" : preview.kind === "video" ? "MP4" : "image"}</a>
        <a className="btn btn-ghost !text-xs" href={preview.url} target="_blank" rel="noreferrer">Open in new tab</a>
        <p className="text-[0.7rem] text-leaf-950/50">{preview.prompt}</p>
      </div>
    </section>}

    <section>
      <div className="mb-3 flex items-center gap-2"><Sparkles size={16} className="text-leaf-700"/><h2 className="text-sm font-bold text-leaf-950">Your {active.label} projects</h2></div>
      {shown.length === 0 ? <p className="glass rounded-3xl p-6 text-sm text-leaf-950/60">Nothing here yet. Your generated files will appear in this list.</p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((item) => <article className="glass overflow-hidden rounded-3xl" key={item.id}>
          <div className="aspect-video bg-white/50">
            {item.kind === "video" ? <video src={item.url} controls preload="metadata" className="h-full w-full object-cover"/> : item.kind === "code" ? <iframe src={item.url} title={item.prompt} className="h-full w-full" sandbox="allow-scripts"/> : item.url ? <Image src={item.url} alt={item.prompt} width={640} height={360} unoptimized className="h-full w-full object-cover"/> : null}
          </div>
          <div className="p-4">
            <p className="line-clamp-2 text-xs leading-relaxed text-leaf-950/75">{item.prompt}</p>
            <div className="mt-2 flex items-center justify-between gap-2"><span className="tag">{item.source}</span><a className="text-[0.7rem] font-semibold text-leaf-800 underline underline-offset-2" href={`${item.url}?download=1`}>Download</a></div>
          </div>
        </article>)}
      </div>}
    </section>
  </div>;
}
