import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import MobileDock from "@/components/mobile-dock";
import AdminShortcut from "@/components/admin-shortcut";
import AppConfigSync from "@/components/app-config-sync";
import PwaRegister from "@/components/pwa-register";
import StandaloneChatRedirect from "@/components/standalone-chat-redirect";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SwiftSite — chat, build and create", template: "%s · SwiftSite" },
  description: "A SwiftSite AI assistant with exact tools, multilingual chat, image/video creation, prompt-built HTML websites and private history.",
  keywords: ["AI assistant", "website builder", "image tools", "video studio", "developer tools", "SwiftSite"],
  applicationName: "SwiftSite",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "SwiftSite" },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e7f2dd" },
    { media: "(prefers-color-scheme: dark)", color: "#17301a" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en">
    <body>
      {children}
      <StandaloneChatRedirect />
      <MobileDock />
      <AdminShortcut />
      <AppConfigSync />
      <PwaRegister />
    </body>
  </html>;
}
