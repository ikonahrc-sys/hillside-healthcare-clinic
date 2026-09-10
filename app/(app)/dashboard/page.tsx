import { getCurrentUser } from "@/lib/auth/session";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
      <p className="mt-2 text-sm text-slate-500">
        Welcome, {user?.fullName}. Department dashboards (Today / Tomorrow /
        Upcoming) arrive in later phases as each department gets built.
      </p>
    </div>
  );
}
