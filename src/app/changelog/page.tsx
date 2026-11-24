import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = { title: "Release notes", description: "What changed in SwiftSite, in plain language." };

const notes = [
  ["1.6", "This week", [
    "Chat answers in the same language you write in, without any setup.",
    "A spare provider takes over automatically when the first one is slow.",
    "Roman Urdu is answered in Roman Urdu; mixed messages are mirrored.",
    "Hiba Kashif built the page structure and reviewed mobile spacing and the wording on the tools pages.",
  ]],
  ["1.5", "October 2026", [
    "Six assistant modes, each with its own instruction set.",
    "Reusable prompt library with fill-in variables.",
    "Twelve deterministic tools, available in chat and as standalone pages.",
  ]],
  ["1.2", "September 2026", [
    "Searchable conversation history, grouped by day.",
    "Tools moved to a hand-written maths parser with no eval.",
    "JSON, Base64, hashing and text statistics added.",
  ]],
];

export default function ChangelogPage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <p className="text-sm font-bold tracking-wide text-leaf-700 uppercase">Release notes</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-leaf-950 sm:text-4xl">What actually changed</h1>
        <p className="mt-3 text-leaf-950/70">
          Short notes, written after the work was finished. For the API details, read the{" "}
          <Link className="font-semibold text-leaf-700 underline underline-offset-2" href="/docs">documentation</Link>.
        </p>
        <div className="mt-10 space-y-5">
          {notes.map(([version, date, items]) => (
            <article className="glass rounded-3xl p-6" key={version as string}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="log-version">v{version as string}</span>
                <h2 className="text-lg font-extrabold text-leaf-950">{date as string}</h2>
              </div>
              <ul className="mt-4 space-y-2 text-[0.92rem] leading-relaxed text-leaf-950/75">
                {(items as string[]).map((item) => <li className="flex gap-2" key={item}><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-leaf-500"/>{item}</li>)}
              </ul>
            </article>
          ))}
        </div>
        <p className="hand-note mt-8">more notes coming as we ship…</p>
      </main>
    </div>
  );
}
