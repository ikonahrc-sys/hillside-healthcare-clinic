import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import {
  listMyNotifications,
  markAllNotificationsRead,
} from "@/lib/services/notification-service";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  const notifications = await listMyNotifications(user);

  // Opening this page is the "seen it" signal - no per-item read/unread
  // UI to manage, matching how a bell-icon notification list commonly
  // works. Marking after the fetch above so the badge on this very page
  // load still reflects what was actually unread on arrival.
  await markAllNotificationsRead(user);

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">
        Notifications
      </h1>

      {notifications.length === 0 ? (
        <p className="text-sm text-slate-500">No notifications yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((n) => {
            const content = (
              <>
                <p className="text-sm text-slate-900">{n.message}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {n.createdAt.toLocaleString("en-US", {
                    timeZone: "America/Belize",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </>
            );
            return (
              <li
                key={n.id}
                className={`rounded border p-3 ${
                  n.readAt ? "border-slate-200 bg-white" : "border-slate-300 bg-slate-50"
                }`}
              >
                {n.link ? (
                  <Link href={n.link} className="block hover:underline">
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
