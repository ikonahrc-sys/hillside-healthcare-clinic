import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { logoutAction } from "@/lib/actions/auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50">
      <p className="text-slate-700">
        Signed in as <span className="font-medium">{user.fullName}</span> (
        {user.role.name})
      </p>
      <form action={logoutAction}>
        <button
          type="submit"
          className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
