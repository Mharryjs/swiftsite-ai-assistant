"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Globe, Loader2, Lock, Mail, UserRound } from "lucide-react";

type AuthInfo = { user: { id: string; name: string } | null; googleReady: boolean; ownerEmail: string };

const errorCopy: Record<string, string> = {
  google_not_configured: "Google sign-in is built and ready, but this deployment has no Google OAuth keys yet. Email login works right now; add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to switch Google on.",
  state_mismatch: "The Google sign-in attempt expired. Please try again.",
  google_token: "Google did not return a token. Please try again.",
  google_profile: "Could not read your Google profile.",
  email_unverified: "Please verify your email with Google first.",
};

export default function AuthForm({ initialMode = "login" }: { initialMode?: "login" | "signup" }) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [googleReady, setGoogleReady] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState("sswiftsite@gmail.com");
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 9).toFixed(2)}deg)`;
      });
    };
    const onLeave = () => { card.style.transform = "rotateX(0deg) rotateY(0deg)"; };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get("error");
    if (key) setError(errorCopy[key] ?? "That sign-in method is not available yet. Use email below.");
    if (params.get("next")) setNotice("Sign in to open the page you asked for.");
    fetch("/api/auth").then((r) => r.json()).then((data: AuthInfo) => {
      setGoogleReady(Boolean(data.googleReady));
      if (data.ownerEmail) setOwnerEmail(data.ownerEmail);
      if (data.user) router.replace("/dashboard");
    }).catch(() => {});
  }, [router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: mode, email, password, name }),
      });
      const data = (await response.json()) as { error?: string; user?: { name: string } };
      if (!response.ok || data.error) throw new Error(data.error ?? "Could not sign in.");
      router.replace("/dashboard");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="auth-shell">
    <span className="auth-orb a" aria-hidden="true"/>
    <span className="auth-orb b" aria-hidden="true"/>
    <span className="auth-orb c" aria-hidden="true"/>
    <div className="auth-card glass-strong" ref={cardRef}>
      <Link href="/" className="chat-brand mb-6" aria-label="SwiftSite home">
        <Image src="/icon.svg" alt="" width={36} height={36} />
        <strong><span>Swift</span><span>Site</span></strong>
      </Link>
      <p className="text-sm font-bold tracking-wide text-leaf-700 uppercase">{mode === "login" ? "Welcome back" : "Create your account"}</p>
      <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-leaf-950 sm:text-3xl">
        {mode === "login" ? "Sign in to your workspace" : "One account, all your work"}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-leaf-950/65">
        {mode === "login"
          ? "Chats, studio projects and settings follow your account — not just this browser."
          : "Real email and password, stored with a salted scrypt hash. No marketing email, ever."}
      </p>

      <div className="auth-tabs">
        <button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }} type="button">Sign in</button>
        <button className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setError(""); }} type="button">Create account</button>
      </div>

      <form className="mt-5 grid gap-3" onSubmit={submit}>
        {mode === "signup" && <label className="auth-field"><span><UserRound size={15}/> Name</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Hiba Kashif" autoComplete="name" required /></label>}
        <label className="auth-field"><span><Mail size={15}/> Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required /></label>
        <label className="auth-field"><span><Lock size={15}/> Password</span>
          <div className="relative">
            <input data-password="true" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required />
            <button type="button" className="auth-eye" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
          </div>
        </label>
        {error && <p className="auth-error">{error}</p>}
        {notice && <p className="auth-notice">{notice}</p>}
        <button className="btn btn-primary w-full !py-3" disabled={busy} type="submit">
          {busy ? <><Loader2 className="auth-spin"/> Working…</> : <>{mode === "login" ? "Sign in" : "Create account"} <ArrowRight/></>}
        </button>
      </form>

      <div className="auth-divider"><span>or</span></div>

      <a className="btn btn-ghost w-full !py-3" href="/api/auth/google">
        <Globe/> Continue with Google
        {!googleReady && <span className="auth-soon">keys needed</span>}
      </a>
      {!googleReady && <p className="mt-2 text-[0.7rem] leading-relaxed text-leaf-950/50">
        Google OAuth code is live; this deployment just needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET. Email sign-in below works immediately.
      </p>}

      <p className="mt-5 rounded-xl bg-white/50 p-3 text-[0.72rem] leading-relaxed text-leaf-950/65">
        <strong className="text-leaf-900">Owner account:</strong> {ownerEmail} is reserved for the owner. Sign up with that email to unlock the full admin dashboard.
      </p>
      <p className="mt-4 text-center text-xs text-leaf-950/50">
        <Link className="underline underline-offset-2 hover:text-leaf-800" href="/">← Back to the site</Link>
        <span className="mx-2">·</span>
        <Link className="underline underline-offset-2 hover:text-leaf-800" href="/chat">Use chat as a guest</Link>
      </p>
    </div>
    <p className="hand-note mt-4">3D glass · no tracking scripts — Mharryjs &amp; Hiba</p>
  </div>;
}
