import { getCurrentUser } from "@/lib/auth/session";
import { getMedicalSchedule } from "@/lib/services/appointment-service";
import { MedicalSchedule } from "@/components/dashboard/medical-schedule";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  // Only the Doctor role gets the Medical Today/Tomorrow/Upcoming view for
  // now. The Administrator's own dashboard (Phase 0 §14) is a separate,
  // larger item not built yet - it shouldn't be conflated with Medical's
  // working view just because admin holds every permission.
  if (user?.role.name === "DOCTOR") {
    const schedule = await getMedicalSchedule(user);
    return (
      <div>
        <h1 className="mb-4 text-lg font-semibold text-slate-900">
          Medical Dashboard
        </h1>
        <MedicalSchedule {...schedule} />
      </div>
    );
  }

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
