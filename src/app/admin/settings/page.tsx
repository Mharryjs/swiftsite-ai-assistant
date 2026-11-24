import { redirect } from "next/navigation";
import Link from "next/link";
import { ensureSettings, getCurrentUser, isOwnerUser } from "@/lib/auth";
import AiConnection from "@/components/ai-connection";
import SettingsForm from "@/components/settings-form";
import AdminAppearance from "@/components/admin-appearance";

export const dynamic = "force-dynamic";
export default async function AdminSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!isOwnerUser(user)) redirect("/chat");
  const settings = await ensureSettings(user.id);
  return <main className="mx-auto max-w-4xl px-4 py-8">
    <div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-leaf-700">Owner only</p><h1 className="text-2xl font-bold text-leaf-950">AI & app settings</h1></div><Link className="btn btn-ghost" href="/admin">← Dashboard</Link></div>
    <AiConnection />
    <AdminAppearance />
    <div className="mt-5"><SettingsForm user={{ name: user.name, email: user.email, hasImageKey: Boolean(user.imageApiKey), isOwner: true, hasPassword: Boolean(user.passwordHash), hasGoogle: Boolean(user.googleId) }} settings={{ language: settings.language, defaultMode: settings.defaultMode, imageStyle: settings.imageStyle }}/></div>
    <p className="mt-4 text-xs text-leaf-950/60">Changes are saved in PostgreSQL and applied to the next AI request. Provider quota and pricing are controlled by the provider.</p>
  </main>;
}
