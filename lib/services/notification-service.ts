import "server-only";
import { prisma } from "@/lib/db";
import { requireAuthenticated } from "@/lib/auth/authorize";
import type { CurrentUser } from "@/lib/auth/session";

// Internal - called from other service functions at the point a
// notify-worthy event happens (a referral created, responded to, etc.),
// never directly from an action/page. No authorize() call here: there's
// no permission a caller could hold or lack to "send a notification,"
// the caller has already authorized whatever real action triggered it.
export async function createNotification(
  recipientId: string,
  message: string,
  link?: string,
) {
  return prisma.notification.create({
    data: { recipientId, message, link },
  });
}

// Broadcasts one notification row per active user in a department -
// used when an event is relevant to "whoever is working in Pharmacy
// today" rather than one specific person, since this app has no central
// reception gate or single owner per department.
export async function notifyDepartment(
  departmentId: string,
  message: string,
  link?: string,
  excludeUserId?: string,
) {
  const users = await prisma.user.findMany({
    where: {
      departmentId,
      status: "ACTIVE",
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { id: true },
  });

  await Promise.all(
    users.map((u) => createNotification(u.id, message, link)),
  );
}

export async function listMyNotifications(user: CurrentUser | null) {
  const authedUser = requireAuthenticated(user);

  return prisma.notification.findMany({
    where: { recipientId: authedUser.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function countUnreadNotifications(user: CurrentUser | null) {
  const authedUser = requireAuthenticated(user);

  return prisma.notification.count({
    where: { recipientId: authedUser.id, readAt: null },
  });
}

export async function markNotificationRead(
  user: CurrentUser | null,
  notificationId: string,
) {
  const authedUser = requireAuthenticated(user);

  await prisma.notification.updateMany({
    where: { id: notificationId, recipientId: authedUser.id, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsRead(user: CurrentUser | null) {
  const authedUser = requireAuthenticated(user);

  await prisma.notification.updateMany({
    where: { recipientId: authedUser.id, readAt: null },
    data: { readAt: new Date() },
  });
}
