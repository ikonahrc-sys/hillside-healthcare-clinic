import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/authorize";
import { prisma } from "@/lib/db";
import { listRoles } from "@/lib/services/user-service";
import { NewUserForm } from "@/components/users/new-user-form";

export default async function NewUserPage() {
  const user = await getCurrentUser();

  if (!user || !(await can(user, "user:manage"))) {
    redirect("/users");
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
      <h1 className="mb-1 text-lg font-semibold text-slate-900">New User</h1>
      <p className="mb-4 text-sm text-slate-500">
        Create an account for a new staff member or student.
      </p>
      <NewUserForm roles={roles} departments={departments} />
    </div>
  );
}
