import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getPharmacyDashboard } from "@/lib/services/pharmacy-dashboard-service";
import { can } from "@/lib/auth/authorize";

export default async function PharmacyDashboardPage() {
  const user = await getCurrentUser();

  if (!user || !(await can(user, "prescription:dispense"))) {
    redirect("/dashboard");
  }

  const { pendingCount, todayDispensedCount, lowStock, expiringSoon, expired } =
    await getPharmacyDashboard(user);

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">
        Pharmacy Dashboard
      </h1>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/pharmacy/prescriptions"
          className="rounded border border-slate-200 bg-white p-4 hover:border-slate-300"
        >
          <p className="text-sm font-semibold text-slate-700">
            Prescription Queue
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {pendingCount}
          </p>
          <p className="text-xs text-slate-400">awaiting dispensing</p>
        </Link>

        <div className="rounded border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-700">
            Dispensed Today
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {todayDispensedCount}
          </p>
          <p className="text-xs text-slate-400">items dispensed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Low Stock</h2>
            <Link
              href="/pharmacy/inventory"
              className="text-xs text-slate-500 hover:underline"
            >
              View inventory
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-sm text-slate-400">Nothing low.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {lowStock.map((m) => (
                <li key={m.id} className="text-sm text-slate-700">
                  {m.name} {m.strength} - {m.totalQuantity}/{m.reorderLevel}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">
            Expiring Soon
          </h2>
          {expiringSoon.length === 0 ? (
            <p className="text-sm text-slate-400">Nothing expiring soon.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {expiringSoon.map((b) => (
                <li key={b.id} className="text-sm text-slate-700">
                  {b.medicineName} {b.medicineStrength} ({b.batchNumber}) -{" "}
                  {b.expiryDate.toDateString()}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Expired</h2>
          {expired.length === 0 ? (
            <p className="text-sm text-slate-400">No expired stock.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {expired.map((b) => (
                <li key={b.id} className="text-sm text-red-700">
                  {b.medicineName} {b.medicineStrength} ({b.batchNumber}) -{" "}
                  {b.quantityOnHand} units expired {b.expiryDate.toDateString()}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
