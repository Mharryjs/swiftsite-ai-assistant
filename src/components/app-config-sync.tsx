"use client";

import { useEffect } from "react";

type Config = { name: string; accent: string; font: string };
export default function AppConfigSync() {
  useEffect(() => {
    let active = true;
    const sync = async () => {
      try {
        const res = await fetch("/api/app-config", { cache: "no-store" });
        if (!res.ok || !active) return;
        const config = await res.json() as Config;
        if (!active) return;
        const root = document.documentElement;
        root.style.setProperty("--owner-accent", config.accent);
        root.style.setProperty("--owner-font", `"${config.font}"`);
        root.dataset.appName = config.name;
        document.querySelectorAll<HTMLElement>("[data-brand-name]").forEach(node => { node.textContent = config.name; });
        if (document.title.includes("SwiftSite")) document.title = document.title.replace(/SwiftSite(?: Assistant)?/g, config.name);
      } catch { /* keep current visible appearance */ }
    };
    void sync();
    const onFocus = () => { void sync(); };
    window.addEventListener("focus", onFocus);
    const timer = setInterval(() => void sync(), 20000);
    return () => { active = false; clearInterval(timer); window.removeEventListener("focus", onFocus); };
  }, []);
  return null;
}
