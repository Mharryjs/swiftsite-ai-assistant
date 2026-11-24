import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = { title: "Privacy", description: "What SwiftSite stores, and what it deliberately does not." };

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <div className="glass-strong rounded-[2rem] p-6 sm:p-10">
          <p className="text-sm font-bold tracking-wide text-leaf-700 uppercase">Privacy</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-leaf-950 sm:text-4xl">Short, and no small print</h1>
          <div className="mt-6 space-y-5 text-[0.95rem] leading-relaxed text-leaf-950/75">
            <p>There are no accounts, no passwords and no tracking scripts on this site. On your first visit the browser creates a random workspace ID and keeps it in local storage. That ID is the only thing that ties conversations to you.</p>
            <p>Chat messages and attachments are stored in PostgreSQL or private server storage so you can reopen them later. They are scoped to your workspace; other users cannot open them. The verified SwiftSite owner can review conversations and questions in the protected admin dashboard for support, abuse prevention and product operations. Do not send sensitive personal information you would not want an administrator to read. Clearing a guest browser workspace ID means its chats can no longer be reached from that browser.</p>
            <p>Messages you send to the assistant are processed by SwiftSite AI so a reply can be generated. Built-in slash commands stay on the server and do not call a language model. Provider credentials, when configured by the owner, remain in server storage and are never returned to the browser.</p>
            <p>No advertising cookies, no fingerprinting, no data sold to anyone. If that ever changes, it will be written here first.</p>
          </div>
          <p className="hand-note mt-8">questions? ask in the chat, we read them.</p>
        </div>
      </main>
    </div>
  );
}
