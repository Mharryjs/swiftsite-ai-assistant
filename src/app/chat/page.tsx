import type { Metadata } from "next";
import ChatWorkspace from "@/components/chat-workspace";

export const metadata: Metadata = {
  title: "Assistant",
  description: "Chat, run exact tools and keep your work in one private SwiftSite workspace.",
};

export default function ChatPage() {
  return <ChatWorkspace />;
}
