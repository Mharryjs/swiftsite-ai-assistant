import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = { title: "Terms", description: "Plain-language terms for using SwiftSite." };

export default function TermsPage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <div className="glass-strong rounded-[2rem] p-6 sm:p-10">
          <p className="text-sm font-bold tracking-wide text-leaf-700 uppercase">Terms</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-leaf-950 sm:text-4xl">Use it like a grown-up</h1>
          <div className="mt-6 space-y-5 text-[0.95rem] leading-relaxed text-leaf-950/75">
            <p>SwiftSite is provided as-is, free to try. We keep it running carefully, but there is no uptime guarantee and no promise that an answer is correct. Check anything that matters before you act on it.</p>
            <p>Do not use the assistant to break the law, to harm people, or to hammer the service with automated traffic. If a model is busy, a spare answers or the built-in tools still work.</p>
            <p>Conversations are yours. We do not claim ownership of what you write, and you are responsible for the content you submit and for any keys you add to your deployment.</p>
            <p>These notes can change as the product changes. The version on this page is the one that applies.</p>
          </div>
          <p className="hand-note mt-8">built by two people, not a legal department.</p>
        </div>
      </main>
    </div>
  );
}
