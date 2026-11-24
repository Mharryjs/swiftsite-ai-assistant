import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export default async function SiteHeader({ back = false }: { back?: boolean }) {
  const user = await getCurrentUser();
  return <div className="site-header-shell sticky top-0 z-30 px-3 pt-3"><header className="site-header glass mx-auto flex max-w-6xl items-center justify-between rounded-full py-2 pr-2 pl-5">
    <Link href="/" aria-label="SwiftSite home" className="inline-flex items-center gap-2.5"><Image src="/icon.svg" alt="" width={36} height={36}/><span className="text-lg font-bold tracking-tight"><span className="text-leaf-900">Swift</span><span className="bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">Site</span></span></Link>
    <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
      <Link className="rounded-full px-3 py-2 text-sm font-semibold text-leaf-950/70 transition hover:bg-white/70 hover:text-leaf-950" href="/#features">Features</Link>
      <Link className="rounded-full px-3 py-2 text-sm font-semibold text-leaf-950/70 transition hover:bg-white/70 hover:text-leaf-950" href="/tools">Tools</Link>
      <Link className="rounded-full px-3 py-2 text-sm font-semibold text-leaf-950/70 transition hover:bg-white/70 hover:text-leaf-950" href="/studio">Studio</Link>

      <Link className="rounded-full px-3 py-2 text-sm font-semibold text-leaf-950/70 transition hover:bg-white/70 hover:text-leaf-950" href="/docs">Docs</Link>
    </nav>
    <div className="flex items-center gap-1.5">
      {user ? <>
        <Link className="hidden rounded-full px-3 py-2 text-sm font-semibold text-leaf-800 hover:bg-white/70 sm:block" href="/settings">{user.name.split(" ")[0]}</Link>
        <Link className="hidden rounded-full px-3 py-2 text-sm font-semibold text-leaf-900 hover:bg-white/70 md:block" href="/studio">Studio</Link><Link className="site-header-cta btn btn-primary !rounded-full" href="/chat"><span>Open assistant</span> <ArrowRight/></Link>
      </> : <Link className="site-header-cta btn btn-primary !rounded-full" href="/chat"><span>Open assistant</span><ArrowRight/></Link>}
      {back && <Link className="btn btn-ghost !rounded-full" href="/"><ArrowLeft/> Home</Link>}
    </div>
  </header></div>;
}
