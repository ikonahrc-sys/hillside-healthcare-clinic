import "server-only";
import { prisma } from "@/lib/db";
import { authorize } from "@/lib/auth/authorize";
import { getFacilityDayRange } from "@/lib/utils/schedule";
import { listMedicinesWithStock } from "@/lib/services/inventory-service";
import type { CurrentUser } from "@/lib/auth/session";

// Composes listMedicinesWithStock(), which does its own inventory:manage
// check - fine today since PHARMACIST/ADMINISTRATOR always hold both
// prescription:dispense and inventory:manage together, but a future role
// with only one of the two would need this reconsidered.
export async function getPharmacyDashboard(user: CurrentUser | null) {
  await authorize(user, "prescription:dispense");

  const today = getFacilityDayRange(0);

  const [pendingCount, todayDispensedCount, medicines] = await Promise.all([
    prisma.prescription.count({
      where: { status: { in: ["PENDING", "PROCESSING"] } },
    }),
    prisma.inventoryTransaction.count({
      where: {
        type: "DISPENSED",
        createdAt: { gte: today.start, lt: today.end },
      },
    }),
    listMedicinesWithStock(user),
  ]);

  const lowStock = medicines.filter((m) => m.isLowStock);

  const expiringSoon = medicines.flatMap((m) =>
    m.batches
      .filter((b) => b.isExpiringSoon)
      .map((b) => ({ ...b, medicineName: m.name, medicineStrength: m.strength })),
  );

  const expired = medicines.flatMap((m) =>
    m.batches
      .filter((b) => b.isExpired && b.quantityOnHand > 0)
      .map((b) => ({ ...b, medicineName: m.name, medicineStrength: m.strength })),
  );

  return { pendingCount, todayDispensedCount, lowStock, expiringSoon, expired };
}
