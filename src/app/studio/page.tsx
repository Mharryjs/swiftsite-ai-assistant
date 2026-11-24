import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { generations } from "@/db/schema";
import { ensureSettings, getCurrentUser } from "@/lib/auth";
import SiteHeader from "@/components/site-header";
import Studio from "@/components/studio";

export const metadata: Metadata = { title: "Studio", description: "Generate real images, a 10-second MP4 and complete HTML pages." };
export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/studio");
  const settings = await ensureSettings(user.id);
  const rows = await db
    .select({
      id: generations.id, kind: generations.kind, prompt: generations.prompt,
      source: generations.source, createdAt: generations.createdAt,
    })
    .from(generations)
    .where(eq(generations.userId, user.id))
    .orderBy(desc(generations.createdAt))
    .limit(24);

  return <div className="min-h-dvh">
    <SiteHeader />
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold tracking-wide text-leaf-700 uppercase">Image &amp; video tools</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-leaf-950 sm:text-4xl">Image, video &amp; website studio</h1>
          <p className="mt-2 max-w-xl text-leaf-950/70">Generate a real provider image or video with credits, edit your uploaded photos, or build a complete website. Results are saved to your workspace.</p>
        </div>
        <p className="hand-note">files land in your account, not the bin →</p>
      </div>
      <div className="mt-7">
        <Studio initialItems={rows.map((row) => ({ id: row.id, kind: row.kind, prompt: row.prompt, source: row.source, url: `/api/media/${row.id}` }))} language={settings.language} />
      </div>
    </main>
  </div>;
}
