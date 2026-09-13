import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/authorize";
import { getDepartmentData } from "@/lib/services/department-data-service";
import { StatCard } from "@/components/charts/stat-card";
import { BarChart } from "@/components/charts/bar-chart";

export default async function DepartmentDataPage() {
  const user = await getCurrentUser();

  if (!user || !(await can(user, "placement:manage"))) {
    redirect("/dashboard");
  }

  const data = await getDepartmentData(user);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="mb-1 text-lg font-semibold text-slate-900">
          Department Data
        </h1>
        <p className="text-sm text-slate-500">
          Facility-wide activity across every department, at a glance.
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          Referrals Received by Department
        </h2>
        <div className="rounded border border-slate-200 bg-white p-4">
          <BarChart data={data.referralsByDepartment} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Medical</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Consultations (total)" value={data.medical.consultationsTotal} />
          <StatCard label="Consultations (last 7 days)" value={data.medical.consultationsWeek} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Rehabilitation</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Active treatment plans" value={data.rehab.activeTreatmentPlans} />
          <StatCard label="Therapy sessions (last 7 days)" value={data.rehab.therapySessionsWeek} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Home Nursing</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Active care plans" value={data.homeNursing.activeCarePlans} />
          <StatCard label="Home visits (last 7 days)" value={data.homeNursing.homeVisitsWeek} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Pharmacy</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Prescriptions pending" value={data.pharmacy.prescriptionsPending} />
          <StatCard label="Dispensed (last 7 days)" value={data.pharmacy.dispensedWeek} />
          <StatCard
            label="Low stock medicines"
            value={data.pharmacy.lowStockCount}
            tone={data.pharmacy.lowStockCount > 0 ? "warning" : "default"}
          />
          <StatCard
            label="Batches expiring soon"
            value={data.pharmacy.expiringSoonCount}
            tone={data.pharmacy.expiringSoonCount > 0 ? "warning" : "default"}
          />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Public Health</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Outreach visits (total)" value={data.publicHealth.outreachVisitsTotal} />
          <StatCard label="Outreach visits (last 7 days)" value={data.publicHealth.outreachVisitsWeek} />
          <StatCard label="People reached (total)" value={data.publicHealth.peopleReachedTotal} />
        </div>
        {data.publicHealth.surveillanceByStatus.length > 0 && (
          <div className="mt-4 rounded border border-slate-200 bg-white p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Surveillance cases by status
            </h3>
            <BarChart data={data.publicHealth.surveillanceByStatus} />
          </div>
        )}
      </div>
    </div>
  );
}
