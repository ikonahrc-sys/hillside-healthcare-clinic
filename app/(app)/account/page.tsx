import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { ChangePasswordForm } from "@/components/account/change-password-form";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">My Account</h1>
      <p className="mb-4 text-sm text-slate-500">
        {user.fullName} ({user.email}) - {user.role.name}
      </p>

      <h2 className="mb-3 text-sm font-semibold text-slate-700">
        Change Password
      </h2>
      <ChangePasswordForm />
    </div>
  );
}
