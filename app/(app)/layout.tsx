import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/authorize";
import { countUnreadNotifications } from "@/lib/services/notification-service";
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
  const canManageClinicalPrep = await can(user, "clinical-prep:manage");
  const canManageUsers = await can(user, "user:manage");
  const unreadNotificationCount = await countUnreadNotifications(user);

  return (
    <AppShell
      user={user}
      canManagePlacements={canManagePlacements}
      canManageClinicalPrep={canManageClinicalPrep}
      canManageUsers={canManageUsers}
      unreadNotificationCount={unreadNotificationCount}
    >
      {children}
    </AppShell>
  );
}
