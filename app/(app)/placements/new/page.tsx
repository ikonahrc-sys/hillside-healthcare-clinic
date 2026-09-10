import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/authorize";
import { prisma } from "@/lib/db";
import {
  listStudentUsers,
  listPotentialSupervisors,
} from "@/lib/services/placement-service";
import { NewPlacementForm } from "@/components/placements/new-placement-form";

export default async function NewPlacementPage() {
  const user = await getCurrentUser();

  if (!user || !(await can(user, "placement:manage"))) {
    redirect("/placements");
  }

  const [students, supervisors, departments] = await Promise.all([
    listStudentUsers(user),
    listPotentialSupervisors(user),
    prisma.department.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">
        New Clinical Placement
      </h1>
      <p className="mb-4 text-sm text-slate-500">
        Assign a student to a department for a defined date range.
      </p>
      <NewPlacementForm
        students={students}
        departments={departments}
        supervisors={supervisors}
      />
    </div>
  );
}
