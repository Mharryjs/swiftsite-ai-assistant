import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SwiftSite — Chat, Build & Create",
    short_name: "SwiftSite",
    description: "Chat, exact tools, image and video studio, and prompt-built HTML websites.",
    start_url: "/chat",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#e7f2dd",
    theme_color: "#3e8f26",
    categories: ["productivity", "utilities", "developer tools"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
