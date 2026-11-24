"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ImageIcon, MessageSquare, Wrench } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/studio", label: "Studio", icon: ImageIcon },
  { href: "/tools", label: "Tools", icon: Wrench },
];

export default function MobileDock() {
  const pathname = usePathname();
  if (pathname.startsWith("/chat") || pathname.startsWith("/login") || pathname.startsWith("/logout") || pathname.startsWith("/admin")) return null;

  return <nav className="mobile-dock" aria-label="Mobile app navigation">
    {items.map((item) => {
      const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
      return <Link key={item.href} href={item.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
        <item.icon size={18}/><span>{item.label}</span>
      </Link>;
    })}
  </nav>;
}
