"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/** When SwiftSite runs as an installed app, open straight into the chat. */
export default function StandaloneChatRedirect() {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (pathname === "/chat" || pathname.startsWith("/admin") || (pathname === "/login" && new URLSearchParams(window.location.search).get("next") === "/admin")) return;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) router.replace("/chat");
  }, [pathname, router]);
  return null;
}
