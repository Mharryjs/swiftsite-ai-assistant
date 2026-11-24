"use client";

import { useEffect } from "react";

export default function AdminShortcut() {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        window.location.assign("/admin");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  return null;
}
