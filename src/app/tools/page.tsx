import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import ToolsWorkspace from "@/components/tools-workspace";

export const metadata: Metadata = { title: "Tools", description: "Instant server utilities with no AI model and no waiting." };

export default function ToolsPage(){return <div className="min-h-dvh"><SiteHeader/><main className="mx-auto max-w-6xl px-4 py-14 sm:px-6"><p className="text-sm font-bold tracking-wide text-leaf-700 uppercase">Tools</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-leaf-950 sm:text-4xl">Instant utilities, no waiting</h1><p className="mt-3 max-w-2xl text-leaf-950/70">Every tool runs on the server without an AI model. Use it here or type the same slash command in any conversation.</p><ToolsWorkspace/></main></div>}
