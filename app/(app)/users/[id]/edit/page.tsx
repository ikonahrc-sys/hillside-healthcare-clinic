import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/authorize";
import { getUser, listRoles } from "@/lib/services/user-service";
import { prisma } from "@/lib/db";
import { EditUserRoleForm } from "@/components/users/edit-user-role-form";

export default async function EditUserRolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user || !(await can(user, "user:manage"))) {
    redirect("/users");
  }

  const target = await getUser(user, id);
  if (!target) {
    notFound();
  }

  const [roles, departments] = await Promise.all([
    listRoles(user),
    prisma.department.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">
        Edit Role
      </h1>
      <p className="mb-4 text-sm text-slate-500">
        {target.fullName} ({target.email})
      </p>
      <EditUserRoleForm
        userId={target.id}
        roles={roles}
        departments={departments}
        currentRoleId={target.roleId}
        currentDepartmentId={target.departmentId}
      />
    </div>
  );
}
