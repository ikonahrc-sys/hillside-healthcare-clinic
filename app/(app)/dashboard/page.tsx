import { getCurrentUser } from "@/lib/auth/session";
import {
  getMedicalSchedule,
  getRehabSchedule,
  getHomeNursingSchedule,
  getPharmacySchedule,
  getPublicHealthSchedule,
} from "@/lib/services/appointment-service";
import { listActiveDepartmentPlacements } from "@/lib/services/placement-service";
import { DepartmentSchedule } from "@/components/dashboard/department-schedule";
import { DepartmentPlacements } from "@/components/dashboard/department-placements";

// Which roles get a Today/Tomorrow/Upcoming dashboard, and how to load it.
// The Administrator's own dashboard (Phase 0 §14) is a separate, larger
// item not built yet - it shouldn't be conflated with a single department's
// working view just because admin holds every permission. Directors/Heads
// hold the same appointment:manage-gated permissions as the staff they
// oversee (see prisma/seed.ts), so they get the same schedule, scoped the
// same way (their own staffId) - it's only populated if they personally
// have appointments assigned to them, same as any other holder of that role.
const SCHEDULE_BY_ROLE: Record<
  string,
  { title: string; load: typeof getMedicalSchedule }
> = {
  DOCTOR: { title: "Medical Dashboard", load: getMedicalSchedule },
  MEDICAL_DIRECTOR: { title: "Medical Dashboard", load: getMedicalSchedule },
  PHYSIOTHERAPIST: { title: "Rehabilitation Dashboard", load: getRehabSchedule },
  SPEECH_THERAPIST: { title: "Rehabilitation Dashboard", load: getRehabSchedule },
  OCCUPATIONAL_THERAPIST: { title: "Rehabilitation Dashboard", load: getRehabSchedule },
  REHABILITATION_DIRECTOR: { title: "Rehabilitation Dashboard", load: getRehabSchedule },
  HOME_NURSING_STAFF: { title: "Home Nursing Dashboard", load: getHomeNursingSchedule },
  HEAD_OF_NURSING: { title: "Home Nursing Dashboard", load: getHomeNursingSchedule },
  PHARMACIST: { title: "Pharmacy Dashboard", load: getPharmacySchedule },
  HEAD_OF_PHARMACY: { title: "Pharmacy Dashboard", load: getPharmacySchedule },
  PUBLIC_HEALTH_DIRECTOR: { title: "Public Health Dashboard", load: getPublicHealthSchedule },
};

// Directors/Heads with placement:manage see a "Students in your
// department" widget - department-scoped by listActiveDepartmentPlacements
// itself, not by this list, but Administrator also holds placement:manage
// and has no single "own department" for this to mean anything (see
// scopeDepartmentId in placement-service.ts), so it's excluded here rather
// than rendering an always-empty widget on the admin's dashboard.
const DIRECTOR_ROLES = new Set([
  "MEDICAL_DIRECTOR",
  "REHABILITATION_DIRECTOR",
  "HEAD_OF_NURSING",
  "HEAD_OF_PHARMACY",
  "PUBLIC_HEALTH_DIRECTOR",
]);

export default async function DashboardPage() {
  const user = await getCurrentUser();

  const isDirector = user ? DIRECTOR_ROLES.has(user.role.name) : false;
  const placements = isDirector ? await listActiveDepartmentPlacements(user) : null;

  const config = user ? SCHEDULE_BY_ROLE[user.role.name] : undefined;
  if (config) {
    const schedule = await config.load(user);
    return (
      <div>
        <h1 className="mb-4 text-lg font-semibold text-slate-900">
          {config.title}
        </h1>
        <DepartmentSchedule {...schedule} />
        {placements && (
          <div className="mt-4">
            <DepartmentPlacements placements={placements} />
          </div>
        )}
      </div>
    );
  }

  if (isDirector && placements) {
    return (
      <div>
        <h1 className="mb-4 text-lg font-semibold text-slate-900">
          Department Dashboard
        </h1>
        <DepartmentPlacements placements={placements} />
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
