import type { Metadata } from "next";
import { redirect } from "next/navigation";
import DashboardPage from "@/app/dashboard/page";
import { getCurrentUser, isOwnerUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Owner admin" };

export default async function OwnerAdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!isOwnerUser(user)) redirect("/chat");
  return DashboardPage();
}
