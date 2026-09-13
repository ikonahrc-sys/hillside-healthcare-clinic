import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/authorize";
import {
  getPlacement,
  listPotentialSupervisors,
} from "@/lib/services/placement-service";
import { prisma } from "@/lib/db";
import { ReassignPlacementForm } from "@/components/placements/reassign-placement-form";

export default async function EditPlacementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user || !(await can(user, "placement:manage"))) {
    redirect("/placements");
  }

  const placement = await getPlacement(user, id);
  if (!placement) {
    notFound();
  }

  const [departments, supervisors] = await Promise.all([
    prisma.department.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    listPotentialSupervisors(user),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">
        Reassign Placement
      </h1>
      <p className="mb-4 text-sm text-slate-500">
        {placement.student.fullName} ({placement.student.email}) - currently{" "}
        {placement.department.name}
        {placement.supervisor ? `, supervised by ${placement.supervisor.fullName}` : ""}.
      </p>
      <ReassignPlacementForm
        placementId={placement.id}
        departments={departments}
        supervisors={supervisors}
        currentDepartmentId={placement.department.id}
        currentSupervisorId={placement.supervisorId}
      />
    </div>
  );
}
