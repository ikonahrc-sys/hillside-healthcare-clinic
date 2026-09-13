import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/authorize";
import { prisma } from "@/lib/db";
import { ResetPasswordForm } from "@/components/users/reset-password-form";

export default async function ResetUserPasswordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user || !(await can(user, "user:manage"))) {
    redirect("/users");
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { fullName: true, email: true },
  });
  if (!target) {
    notFound();
  }

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">
        Reset Password
      </h1>
      <p className="mb-4 text-sm text-slate-500">
        Set a new password for {target.fullName} ({target.email}). Share it
        with them directly - they can change it themselves afterward from My
        Account.
      </p>
      <ResetPasswordForm userId={id} />
    </div>
  );
}
