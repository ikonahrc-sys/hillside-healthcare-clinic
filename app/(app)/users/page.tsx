import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/authorize";
import { listUsers } from "@/lib/services/user-service";
import { setUserStatusAction } from "@/lib/actions/user";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-slate-200 text-slate-700",
  SUSPENDED: "bg-red-100 text-red-800",
};

export default async function UsersPage() {
  const user = await getCurrentUser();

  if (!user || !(await can(user, "user:manage"))) {
    redirect("/dashboard");
  }

  const users = await listUsers(user);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Users & Roles</h1>
        <Link
          href="/users/new"
          className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          New User
        </Link>
      </div>

      <ul className="flex flex-col gap-3">
        {users.map((u) => (
          <li
            key={u.id}
            className="flex items-center justify-between rounded border border-slate-200 bg-white p-4"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">
                {u.fullName}{" "}
                <span className="font-normal text-slate-400">({u.email})</span>
              </p>
              <p className="text-xs text-slate-500">
                {u.role.name}
                {u.department ? ` - ${u.department.name}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[u.status]}`}
              >
                {u.status}
              </span>
              <Link
                href={`/users/${u.id}/reset-password`}
                className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Reset Password
              </Link>
              {u.id !== user.id && (
                <form action={setUserStatusAction}>
                  <input type="hidden" name="userId" value={u.id} />
                  <input
                    type="hidden"
                    name="status"
                    value={u.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"}
                  />
                  <button
                    type="submit"
                    className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {u.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                  </button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
