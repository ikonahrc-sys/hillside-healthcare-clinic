import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/authorize";
import { NewOutreachVisitForm } from "@/components/public-health/new-outreach-visit-form";

export default async function NewOutreachVisitPage() {
  const user = await getCurrentUser();

  if (!user || !(await can(user, "publichealth:manage"))) {
    redirect("/public-health");
  }

  return (
    <div>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">
        New Outreach Visit
      </h1>
      <p className="mb-4 text-sm text-slate-500">
        Log a community outreach or screening visit.
      </p>
      <NewOutreachVisitForm />
    </div>
  );
}
