import type { Metadata } from "next";
import AuthForm from "@/components/auth-form";

export const metadata: Metadata = { title: "Sign in", description: "Sign in with email or Google to open your SwiftSite dashboard." };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode } = await searchParams;
  return <AuthForm initialMode={mode === "signup" ? "signup" : "login"} />;
}
