"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
export default function InstallButton() {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    setInstalled(matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent));
    const handler = (e: Event) => { e.preventDefault(); setEvent(e as InstallEvent); };
    window.addEventListener("beforeinstallprompt", handler);
    const done = () => { setInstalled(true); setEvent(null); };
    window.addEventListener("appinstalled", done);
    return () => { window.removeEventListener("beforeinstallprompt", handler); window.removeEventListener("appinstalled", done); };
  }, []);
  if (installed || (!event && !ios)) return null;
  return <button className="header-new" title="Install SwiftSite chat" onClick={async () => {
    if (event) { await event.prompt(); const choice = await event.userChoice; if (choice.outcome === "accepted") setInstalled(true); setEvent(null); }
    else alert("On iPhone: tap Share in Safari, then Add to Home Screen. The installed app opens directly into chat.");
  }}><Download size={15}/> <span>Install chat</span></button>;
}
