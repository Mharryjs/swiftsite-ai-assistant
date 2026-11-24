import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ensureSettings, getCurrentUser } from "@/lib/auth";
import SiteHeader from "@/components/site-header";
import SettingsForm from "@/components/settings-form";
import AiConnection from "@/components/ai-connection";
import { isOwnerUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Settings", description: "Language, default mode and account settings." };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/settings");
  const settings = await ensureSettings(user.id);

  return <div className="min-h-dvh">
    <SiteHeader />
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-sm font-bold tracking-wide text-leaf-700 uppercase">Settings</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-leaf-950 sm:text-4xl">How SwiftSite talks to you</h1>
      <p className="mt-2 max-w-2xl text-leaf-950/70">Language mirroring, your default mode and the keys that never touch the browser.</p>
      {isOwnerUser(user) && <div className="mt-7"><AiConnection /></div>}
      <div className="mt-7">
        <SettingsForm
          user={{ name: user.name, email: user.email, hasImageKey: Boolean(user.imageApiKey), isOwner: user.isOwner || user.email === "swiftsite@gmail.com", hasPassword: Boolean(user.passwordHash), hasGoogle: Boolean(user.googleId) }}
          settings={{ language: settings.language, defaultMode: settings.defaultMode, imageStyle: settings.imageStyle }}
        />
      </div>
    </main>
  </div>;
}
