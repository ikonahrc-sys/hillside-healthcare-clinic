import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { listMedicines } from "@/lib/services/prescription-service";
import { can } from "@/lib/auth/authorize";
import { ReceiveStockForm } from "@/components/pharmacy/receive-stock-form";

export default async function ReceiveStockPage() {
  const user = await getCurrentUser();

  if (!user || !(await can(user, "inventory:manage"))) {
    redirect("/pharmacy/inventory");
  }

  const medicines = await listMedicines(user);

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">
        Receive Stock
      </h1>
      <ReceiveStockForm medicines={medicines} />
    </div>
  );
}
