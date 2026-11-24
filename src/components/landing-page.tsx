"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { BuildLog, TeamSection } from "@/components/team";
import {
  ArrowRight, Binary, BookMarked, Braces, Calculator, CalendarDays, CaseSensitive,
  ChartLine, Check, Code2, Database, Fingerprint, GraduationCap, Hash,
  KeyRound, Languages, ListOrdered, MessagesSquare, PenLine, Play, Ruler,
  ShieldCheck, Shuffle, Sparkles, Terminal, Zap,
} from "lucide-react";

function Brand({ profile = false }: { profile?: boolean }) {
  return <span className="inline-flex items-center gap-2.5">
    <Image src={profile ? "/images/mharryjs.png" : "/icon.svg"} alt={profile ? "MharryJS" : "SwiftSite"} width={profile ? 24 : 36} height={profile ? 24 : 36} className={profile ? "h-6 w-6 rounded-full border border-white object-cover ring-1 ring-amber-400/70" : "h-9 w-9 shrink-0"}/>
    {!profile && <span className="text-lg font-bold tracking-tight"><span className="text-leaf-900">Swift</span><span className="bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">Site</span></span>}
  </span>;
}

const liveDemos = [
  ["calc", "(1250 * 12) / 7 + sqrt(144)"], ["convert", "5 miles to km"],
  ["days", "today 2026-12-25"],
  ["password", "24"], ["hash", "sha256 hello swiftsite"],
] as const;

const features: Array<[ReactNode, string, string]> = [
  [<MessagesSquare key="messages"/>, "Streaming conversations", "Replies appear word by word with Markdown, tables and copy-ready code blocks. Stop a reply or regenerate it any time."],
  [<Sparkles key="sparkles"/>, "Six assistant modes", "Switch between Assistant, Developer, Writer, Translator, Analyst and Tutor — each one tunes how the model thinks and answers."],
  [<Terminal key="terminal"/>, "Instant slash commands", "12 built-in tools run on the server in milliseconds: calculator, unit converter, world clock, hashes, JSON and more."],
  [<BookMarked key="book"/>, "Prompt library", "Save prompts with {{variables}}, fill in the blanks and launch a fresh conversation in the right mode with one click."],
  [<KeyRound key="key"/>, "One assistant, steady answers", "SwiftSite keeps the conversation moving and routes around a slow model automatically, while the header shows the real engine in use."],
  [<Database key="database"/>, "History that stays put", "Conversations are stored in PostgreSQL. Search, pin, rename, export to Markdown or delete everything whenever you like."],
];

const modes: Array<[ReactNode, string, string]> = [
  [<Sparkles key="assistant"/>, "Assistant", "Everyday questions, ideas and answers."],
  [<Code2 key="developer"/>, "Developer", "Write, explain and debug code."],
  [<PenLine key="writer"/>, "Writer", "Emails, posts, rewrites and tone."],
  [<Languages key="translator"/>, "Translator", "Translate and polish across languages."],
  [<ChartLine key="analyst"/>, "Analyst", "Break down data, plans and decisions."],
  [<GraduationCap key="tutor"/>, "Tutor", "Learn step by step with examples."],
];

const toolCards: Array<[ReactNode, string, string, string, string]> = [
  [<Calculator key="calc"/>, "Calculator", "Evaluates maths safely: operators, powers, percentages and functions like sqrt, log, sin.", "calc", "(1250 * 12) / 7 + sqrt(144)"],
  [<Ruler key="convert"/>, "Unit converter", "Length, weight, volume, speed, area, data, time and temperature.", "convert", "5 miles to km"],

  [<CalendarDays key="days"/>, "Date calculator", "Days between two dates, or the date after adding or removing days.", "days", "today 2026-12-25"],
  [<KeyRound key="password"/>, "Password generator", "Strong random passwords from a cryptographically secure generator.", "password", "24"],
  [<Fingerprint key="uuid"/>, "UUID generator", "Random v4 UUIDs, up to 20 at a time.", "uuid", "3"],
  [<Hash key="hash"/>, "Hash generator", "MD5, SHA-1, SHA-256, SHA-384 and SHA-512 digests of any text.", "hash", "sha256 hello swiftsite"],
  [<Binary key="base64"/>, "Base64", "Encode text to Base64 or decode it back, UTF-8 safe.", "base64", "encode Hello, world"],
  [<Braces key="json"/>, "JSON formatter", "Validate, pretty-print or minify JSON with clear error messages.", "json", "{\"name\":\"SwiftSite\",\"tools\":[1,2,3]}"],
  [<ListOrdered key="count"/>, "Text statistics", "Words, characters, sentences and estimated reading time.", "count", "The quick brown fox jumps over the lazy dog."],
  [<CaseSensitive key="case"/>, "Case converter", "UPPER, lower, Title, camelCase, snake_case, kebab-case and slugs.", "case", "snake Hello World From SwiftSite"],
  [<Shuffle key="random"/>, "Random picker", "A random number in a range, a coin flip or a dice roll.", "random", "1 100"],
];

const faq = [
  ["Do I need an API key to use it?", "No. Out of the box SwiftSite answers through a pool of free providers and switches between them automatically if one is busy. They are shared, text-only and can be slower at busy times. For steady speed and image support, add a key from Groq, Google Gemini, OpenRouter, OpenAI, Mistral or DeepSeek in Settings — Gemini and Groq both have free tiers."],
  ["Where is my data stored?", "In a PostgreSQL database, tied to an anonymous workspace ID that lives in your browser. There are no accounts, so clearing your browser data means losing access unless you copied your workspace ID from Settings."],
  ["Who can see my API key?", "The key is saved against your workspace on the server and is only used to call your provider from the server. It is never sent back to the browser — Settings only shows the last four characters."],
  ["What are the built-in tools?", "Deterministic utilities that run without any AI model: a safe calculator, unit and time-zone conversion, date maths, password and UUID generators, hashes, Base64, JSON formatting, text statistics and case conversion. Type /help in a chat to list them."],
  ["Can the AI be wrong?", "Yes. Language models can produce confident mistakes, so double-check anything important. The built-in tools, in contrast, always compute their results exactly."],
];

export default function LandingPage() {
  const [command, setCommand] = useState("calc");
  const [input, setInput] = useState("(1250 * 12) / 7 + sqrt(144)");
  const [output, setOutput] = useState("(1250 * 12) / 7 + sqrt(144) = 2,154.85714286");
  const [loading, setLoading] = useState(false);

  function chooseDemo(demo: typeof liveDemos[number]) { setCommand(demo[0]); setInput(demo[1]); }
  async function runTool(event: FormEvent) {
    event.preventDefault(); setLoading(true);
    try {
      const response = await fetch("/api/tools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ command, input }) });
      const data = (await response.json()) as { result?: string; error?: string };
      setOutput(response.ok && data.result ? `${input} = ${data.result}` : data.error ?? "Could not run tool");
    } catch { setOutput("Could not run tool"); }
    finally { setLoading(false); }
  }

  return <div className="landing-app min-h-dvh">
    <a className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-leaf-900" href="#main">Skip to content</a>
    <div className="site-header-shell sticky top-0 z-30 px-3 pt-3">
      <header className="site-header glass mx-auto flex max-w-6xl items-center justify-between rounded-full py-2 pr-2 pl-5">
        <Link href="/" aria-label="SwiftSite home"><Brand/></Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {[['Features','/#features'],['How it works','/#how'],['Tools','/#tools'],['Docs','/docs'],['FAQ','/#faq']].map(([label,href]) => <Link key={label} className="rounded-full px-4 py-2 text-sm font-semibold text-leaf-950/70 transition hover:bg-white/70 hover:text-leaf-950" href={href}>{label}</Link>)}
        </nav>
        <div className="flex items-center gap-1.5">

          <Link className="site-header-cta btn btn-primary !rounded-full" href="/chat"><span>Open assistant</span><ArrowRight/></Link>
        </div>
      </header>
    </div>

    <main id="main">
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-12 pb-16 sm:px-6 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:gap-14 lg:pb-24">
        <div className="animate-fade-up">
          <span className="chip !px-3.5 !py-1.5 !text-xs"><Zap/> Chat · Tools · Automation in one workspace</span>
          <h1 className="mt-5 text-4xl leading-[1.08] font-extrabold tracking-tight text-leaf-950 sm:text-5xl lg:text-[3.6rem]">An AI assistant that actually <span className="serif-accent bg-gradient-to-r from-leaf-600 to-emerald-700 bg-clip-text text-transparent">gets things done.</span></h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-leaf-950/85 sm:text-lg">SwiftSite pairs AI conversations with instant built-in tools and reusable prompt workflows. Start in seconds with no sign-up. It answers in English or Roman Urdu, builds websites from a prompt, and keeps your history in your own workspace.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3"><Link className="btn btn-primary !px-6 !py-3 !text-[0.95rem]" href="/chat">Start chatting <ArrowRight/></Link><a className="btn btn-ghost !px-6 !py-3 !text-[0.95rem]" href="/login?mode=signup">Create a free account</a></div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-leaf-950/85">{["No sign-up needed","Streaming replies","Your data, your workspace"].map(item => <li key={item} className="flex items-center gap-2"><ShieldCheck className="text-leaf-600"/>{item}</li>)}</ul>
          <p className="hand-note mt-6">two makers, no sales team — Mharryjs &amp; Hiba</p>
        </div>
        <div className="animate-fade-up [animation-delay:120ms]">
          <div className="glass-strong rounded-[1.75rem] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-bold text-leaf-950">Try it live</h2><p className="text-xs text-leaf-950/60">Runs on our server right now — no AI model involved.</p></div><span className="chip"><span className="h-2 w-2 rounded-full bg-leaf-500"/>Online</span></div>
            <form className="mt-4 flex gap-2" onSubmit={runTool}>
              <div className="relative min-w-0 flex-1"><span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 font-mono text-sm font-bold text-leaf-600">/</span><label className="sr-only" htmlFor="demo-cmd">Command</label><input className="field !pl-7 font-mono !text-[0.85rem]" id="demo-cmd" value={`${command} ${input}`} onChange={(event) => { const [next,...rest] = event.target.value.split(" "); setCommand(next); setInput(rest.join(" ")); }} placeholder="calc 15% of 2450"/></div>
              <button className="btn btn-primary" type="submit" disabled={loading}><Play/>{loading ? "Run…" : "Run"}</button>
            </form>
            <div className="mt-3 flex flex-wrap gap-1.5">{liveDemos.map(demo => <button key={demo[0]} onClick={() => chooseDemo(demo)} className="cursor-pointer rounded-full border border-white/90 bg-white/55 px-3 py-1 font-mono text-[0.7rem] text-leaf-900 transition hover:bg-white">{demo[0]}</button>)}</div>
            <div className="mt-4 min-h-[8.5rem] rounded-2xl border border-white/90 bg-white/60 px-4 py-3.5"><p className="text-sm font-semibold leading-relaxed text-leaf-950">{output.split(" = ")[0]} = <code className="rounded-md bg-leaf-100/70 px-1.5 py-0.5 font-mono text-xs text-leaf-900">{output.split(" = ").slice(1).join(" = ") || output}</code></p></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14 sm:px-6" id="features">
        <div className="max-w-2xl"><p className="text-sm font-bold tracking-wide text-leaf-700 uppercase">Features</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight text-leaf-950 sm:text-4xl">Everything in <span className="serif-accent">one calm place</span></h2><p className="mt-3 text-leaf-950/70">Built for people who use AI every day and want fewer tabs, faster answers and no clutter.</p></div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{features.map(([icon,title,text], index) => <article key={title} className="glass feature-card relative overflow-hidden rounded-3xl p-6 transition hover:-translate-y-0.5 hover:bg-white/55"><span className="card-index">0{index + 1}</span><span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-b from-leaf-200 to-leaf-300 text-leaf-800 shadow-inner">{icon}</span><h3 className="mt-4 text-lg font-bold text-leaf-950">{title}</h3><p className="mt-1.5 text-[0.92rem] leading-relaxed text-leaf-950/70">{text}</p></article>)}</div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6"><div className="glass rounded-[2rem] p-6 sm:p-8"><h2 className="text-xl font-extrabold tracking-tight text-leaf-950 sm:text-2xl">One assistant, six ways of working</h2><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{modes.map(([icon,title,text]) => <div key={title} className="flex items-center gap-3 rounded-2xl bg-white/50 p-3.5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-leaf-100 text-leaf-700">{icon}</span><div><p className="text-sm font-bold text-leaf-950">{title}</p><p className="text-xs text-leaf-950/65">{text}</p></div></div>)}</div></div></section>

      <section className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14 sm:px-6" id="how"><div className="max-w-2xl"><p className="text-sm font-bold tracking-wide text-leaf-700 uppercase">How it works</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight text-leaf-950 sm:text-4xl">From question to result in three steps</h2></div><ol className="mt-10 grid gap-4 md:grid-cols-3">{[
        ["01","Open a chat","No sign-up and no setup. Your private workspace is created the moment you start."],
        ["02","Ask or run a command","Write a question in any language, or type / to run an instant tool without waiting for a model."],
        ["03","Save what works","Turn great prompts into reusable templates and export any conversation as Markdown."],
      ].map(([number,title,text]) => <li key={number} className="glass rounded-3xl p-6"><span className="font-mono text-sm font-bold text-leaf-600">{number}</span><h3 className="mt-2 text-lg font-bold text-leaf-950">{title}</h3><p className="mt-1.5 text-[0.92rem] leading-relaxed text-leaf-950/70">{text}</p></li>)}</ol></section>

      <section className="mx-auto max-w-6xl scroll-mt-24 px-4 py-6 sm:px-6" id="tools">
        <div className="flex flex-wrap items-end justify-between gap-4"><div className="max-w-2xl"><p className="text-sm font-bold tracking-wide text-leaf-700 uppercase">Built-in tools</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight text-leaf-950 sm:text-4xl">12 tools, zero waiting</h2><p className="mt-3 text-leaf-950/70">Each one is a chat command and a standalone page. Exact answers, computed on the server.</p></div><Link className="btn btn-ghost" href="/tools">Open the tools <ArrowRight/></Link></div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{toolCards.map(([icon,title,text,slug,example]) => <div key={slug} className="glass rounded-2xl p-4"><div className="flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-leaf-100 text-leaf-700">{icon}</span><h3 className="text-sm font-bold text-leaf-950">{title}</h3></div><p className="mt-2 text-[0.8rem] leading-snug text-leaf-950/65">{text}</p><code className="mt-2.5 block truncate rounded-lg bg-white/60 px-2.5 py-1.5 font-mono text-[0.7rem] text-leaf-900">/{slug} {example}</code></div>)}</div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6"><div className="glass-strong grid gap-8 rounded-[2rem] p-6 sm:p-10 lg:grid-cols-2"><div><p className="text-sm font-bold tracking-wide text-leaf-700 uppercase">Under the hood</p><h2 className="mt-2 text-2xl font-extrabold tracking-tight text-leaf-950 sm:text-3xl">Plain, dependable engineering</h2><p className="mt-3 leading-relaxed text-leaf-950/70">Requests go from your browser to our server, which streams tokens back from the AI provider as they are generated. Nothing is faked: the status chip in the chat header always shows the real provider and model in use.</p><div className="mt-5 flex flex-wrap gap-2">{["TypeScript","Next.js","PostgreSQL","Drizzle ORM","Server streaming","OpenAI-compatible APIs"].map(item => <span className="chip !text-xs" key={item}>{item}</span>)}</div></div><ul className="grid gap-3 text-sm">{[
        ["Keys stay on the server","API keys are never sent back to the browser."], ["Private by workspace","Every visitor gets an isolated workspace; nobody sees anyone else's chats."], ["Provider-agnostic","Swap models or providers from Settings without touching anything else."], ["No eval, ever","The calculator uses its own parser, so pasted expressions can't run code."],
      ].map(([title,text]) => <li key={title} className="flex gap-3 rounded-2xl bg-white/50 p-4"><ShieldCheck className="mt-0.5 shrink-0 text-leaf-600"/><div><p className="font-bold text-leaf-950">{title}</p><p className="text-leaf-950/65">{text}</p></div></li>)}</ul></div></section>

      <section className="mx-auto max-w-3xl scroll-mt-24 px-4 py-6 sm:px-6" id="faq"><h2 className="text-center text-3xl font-extrabold tracking-tight text-leaf-950 sm:text-4xl">Questions, answered</h2><div className="mt-8 grid gap-3">{faq.map(([question,answer]) => <details className="glass group rounded-2xl px-5 py-4 open:bg-white/55" key={question}><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-leaf-950 [&::-webkit-details-marker]:hidden">{question}<span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/70 text-leaf-700 transition group-open:rotate-45">+</span></summary><p className="mt-3 text-[0.92rem] leading-relaxed text-leaf-950/75">{answer}</p></details>)}</div></section>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="glass-strong flex flex-col items-start justify-between gap-5 rounded-[2rem] p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="max-w-xl">
            <p className="text-sm font-bold tracking-wide text-leaf-700 uppercase">New · Image &amp; video tools</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-leaf-950 sm:text-3xl">Ask for a picture, a 5 or 10-second clip, or a whole webpage</h2>
            <p className="mt-2 text-[0.92rem] leading-relaxed text-leaf-950/70">Sign in and the studio writes real files: an image, a genuine MP4 rendered on the server, filters for your own photo, and a complete HTML/CSS page that matches your prompt — simple when you ask for simple, 3D glass when you ask for 3D.</p>
          </div>
          <Link className="btn btn-primary shrink-0" href="/studio">Try the studio <ArrowRight/></Link>
        </div>
      </section>

      <BuildLog />

      <TeamSection />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6"><div className="glass-strong rounded-[2rem] px-6 py-12 text-center sm:px-10"><h2 className="text-3xl font-extrabold tracking-tight text-leaf-950 sm:text-4xl">Ready when you are</h2><p className="mx-auto mt-3 max-w-lg text-leaf-950/70">Open the assistant, ask your first question and see for yourself. It takes about five seconds.</p><Link className="btn btn-primary mt-7 !px-7 !py-3 !text-[0.95rem]" href="/chat">Start chatting <ArrowRight/></Link></div></section>
    </main>

    <footer className="px-3 pb-6"><div className="glass mx-auto max-w-6xl rounded-[2rem] px-6 py-8 sm:px-10"><div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]"><div><Brand/><p className="mt-3 max-w-xs text-sm leading-relaxed text-leaf-950/65">AI assistant for conversations and automation. Built by Mharryjs with Hiba Kashif — no sign-up, no tracking scripts, and private by default.</p><p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/55 px-3 py-1.5 text-xs font-semibold text-leaf-900"><Brand profile/><span className="-ml-2 inline-flex h-6 w-6 overflow-hidden rounded-full border border-white ring-1 ring-amber-400/70"><Image src="/images/hiba-avatar.jpg" alt="" width={24} height={24} className="h-6 w-6 object-cover"/></span> Built by Mharryjs &amp; Hiba Kashif</p><div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold"><a className="text-leaf-800 hover:underline" href="https://www.instagram.com/swif.site/">Instagram</a><a className="text-leaf-800 hover:underline" href="https://www.linkedin.com/in/m-harry-js-98076442a">LinkedIn</a><a className="text-leaf-800 hover:underline" href="https://github.com/Mharryjs">GitHub</a></div></div>{[
      ["Product",[["Assistant","/chat"],["Studio","/studio"],["Prompt library","/prompts"],["Tools","/tools"],["Team","/#studio"]]],
      ["Resources",[["Documentation","/docs"],["Release notes","/changelog"],["Settings","/settings"],["Features","/#features"],["FAQ","/#faq"]]],
      ["Legal",[["Privacy","/privacy"],["Terms","/terms"]]],
    ].map(([title,links]) => <nav key={title as string} aria-label={title as string}><h2 className="text-xs font-bold tracking-wider text-leaf-800 uppercase">{title as string}</h2><ul className="mt-3 space-y-2">{(links as string[][]).map(([label,href]) => <li key={label}><Link className="text-sm font-medium text-leaf-950/70 transition hover:text-leaf-800" href={href}>{label}</Link></li>)}</ul></nav>)}</div><div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-white/60 pt-5 text-xs text-leaf-950/55 sm:flex-row sm:items-center"><p>© 2026 SwiftSite · Mharryjs &amp; Hiba Kashif. All rights reserved.</p><p className="flex flex-wrap items-center gap-x-4 gap-y-1"><span>Version 1.6 · October 2026</span><span className="hidden sm:inline">·</span><span>AI can make mistakes — verify important facts.</span></p></div></div></footer>
  </div>;
}
