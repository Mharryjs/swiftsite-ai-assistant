import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = { title: "Prompt library", description: "Six starting prompts you can reuse in the SwiftSite assistant." };

const prompts = [
  ["Plan a small launch", "assistant", "Give me a two-week launch plan for {{product}}. I have {{time}} hours a week and a small budget. List the smallest useful steps first."],
  ["Review my code", "developer", "Review this code for bugs, edge cases and readability. Suggest a simpler version:\n\n{{code}}"],
  ["Make my writing clearer", "writer", "Rewrite the text below so it sounds clear and human, not corporate. Keep the meaning and the facts.\n\n{{text}}"],
  ["Translate and polish", "translator", "Translate the text below into {{language}}. Keep the tone natural and preserve formatting.\n\n{{text}}"],
  ["Pick between options", "analyst", "I am choosing between {{option_a}} and {{option_b}}. Compare them on cost, risk, speed and long-term fit, then recommend one."],
  ["Learn it step by step", "tutor", "Teach me {{topic}} from the beginning, using one everyday example and a short practice question at the end."],
] as const;

export default function PromptsPage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <p className="text-sm font-bold tracking-wide text-leaf-700 uppercase">Prompt library</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-leaf-950 sm:text-4xl">Starters that already work</h1>
        <p className="mt-3 max-w-2xl text-leaf-950/70">
          Six prompts we actually use. Open one in the assistant, fill in the blanks and edit it however you like.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {prompts.map(([title, mode, body]) => (
            <article className="glass flex flex-col rounded-3xl p-5" key={title}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-bold text-leaf-950">{title}</h2>
                <span className="tag capitalize">{mode}</span>
              </div>
              <p className="mt-3 flex-1 whitespace-pre-line text-[0.86rem] leading-relaxed text-leaf-950/70">{body}</p>
              <Link
                className="btn btn-ghost mt-4 w-fit !text-xs"
                href={`/chat?prompt=${encodeURIComponent(body)}`}
              >
                Use in chat <ArrowUpRight className="!h-3.5 !w-3.5" />
              </Link>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
