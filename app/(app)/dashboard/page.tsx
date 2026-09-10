import { getCurrentUser } from "@/lib/auth/session";
import {
  getMedicalSchedule,
  getRehabSchedule,
  getHomeNursingSchedule,
} from "@/lib/services/appointment-service";
import { DepartmentSchedule } from "@/components/dashboard/department-schedule";

// Which roles get a Today/Tomorrow/Upcoming dashboard, and how to load it.
// The Administrator's own dashboard (Phase 0 §14) is a separate, larger
// item not built yet - it shouldn't be conflated with a single department's
// working view just because admin holds every permission.
const SCHEDULE_BY_ROLE: Record<
  string,
  { title: string; load: typeof getMedicalSchedule }
> = {
  DOCTOR: { title: "Medical Dashboard", load: getMedicalSchedule },
  PHYSIOTHERAPIST: { title: "Rehabilitation Dashboard", load: getRehabSchedule },
  SPEECH_THERAPIST: { title: "Rehabilitation Dashboard", load: getRehabSchedule },
  OCCUPATIONAL_THERAPIST: { title: "Rehabilitation Dashboard", load: getRehabSchedule },
  HOME_NURSING_STAFF: { title: "Home Nursing Dashboard", load: getHomeNursingSchedule },
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  const config = user ? SCHEDULE_BY_ROLE[user.role.name] : undefined;
  if (config) {
    const schedule = await config.load(user);
    return (
      <div>
        <h1 className="mb-4 text-lg font-semibold text-slate-900">
          {config.title}
        </h1>
        <DepartmentSchedule {...schedule} />
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
