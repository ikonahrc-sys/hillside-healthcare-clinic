import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/authorize";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const canManagePlacements = await can(user, "placement:manage");

  return (
    <AppShell user={user} canManagePlacements={canManagePlacements}>
      {children}
    </AppShell>
  );
}
