import "server-only";
import { prisma } from "@/lib/db";
import { authorize } from "@/lib/auth/authorize";
import { logAudit } from "@/lib/audit/log";
import type { CurrentUser } from "@/lib/auth/session";
import type { ReceiveStockInput } from "@/lib/validation/inventory";

export type MedicineStockSummary = {
  id: string;
  name: string;
  strength: string | null;
  dosageForm: string;
  reorderLevel: number | null;
  totalQuantity: number;
  isLowStock: boolean;
  batches: {
    id: string;
    batchNumber: string;
    expiryDate: Date;
    quantityOnHand: number;
    isExpired: boolean;
    isExpiringSoon: boolean;
  }[];
};

const EXPIRING_SOON_DAYS = 30;

export async function listMedicinesWithStock(
  user: CurrentUser | null,
): Promise<MedicineStockSummary[]> {
  await authorize(user, "inventory:manage");

  const now = new Date();
  const expiringSoonCutoff = new Date(now.getTime() + EXPIRING_SOON_DAYS * 24 * 3600_000);

  const medicines = await prisma.medicine.findMany({
    include: { batches: { orderBy: { expiryDate: "asc" } } },
    orderBy: { name: "asc" },
  });

  return medicines.map((m) => {
    const batches = m.batches.map((b) => ({
      id: b.id,
      batchNumber: b.batchNumber,
      expiryDate: b.expiryDate,
      quantityOnHand: b.quantityOnHand,
      isExpired: b.expiryDate <= now,
      isExpiringSoon: b.expiryDate > now && b.expiryDate <= expiringSoonCutoff,
    }));

    // Only non-expired stock counts toward "how much do we actually have."
    const totalQuantity = batches
      .filter((b) => !b.isExpired)
      .reduce((sum, b) => sum + b.quantityOnHand, 0);

    return {
      id: m.id,
      name: m.name,
      strength: m.strength,
      dosageForm: m.dosageForm,
      reorderLevel: m.reorderLevel,
      totalQuantity,
      isLowStock: m.reorderLevel != null && totalQuantity < m.reorderLevel,
      batches,
    };
  });
}

export async function receiveStock(
  user: CurrentUser | null,
  input: ReceiveStockInput,
) {
  const authedUser = await authorize(user, "inventory:manage");

  const medicine = await prisma.medicine.findUnique({
    where: { id: input.medicineId },
  });
  if (!medicine) {
    throw new Error("Medicine not found");
  }

  const existingBatch = await prisma.medicineBatch.findUnique({
    where: {
      medicineId_batchNumber: {
        medicineId: medicine.id,
        batchNumber: input.batchNumber,
      },
    },
  });
  if (existingBatch) {
    throw new Error(
      `Batch "${input.batchNumber}" already exists for this medicine.`,
    );
  }

  const { batch, transaction } = await prisma.$transaction(async (tx) => {
    const batch = await tx.medicineBatch.create({
      data: {
        medicineId: medicine.id,
        batchNumber: input.batchNumber,
        expiryDate: input.expiryDate,
        quantityOnHand: input.quantity,
      },
    });

    const transaction = await tx.inventoryTransaction.create({
      data: {
        medicineBatchId: batch.id,
        type: "RECEIVED",
        quantityChange: input.quantity,
        performedByUserId: authedUser.id,
      },
    });

    return { batch, transaction };
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: "INVENTORY_RECEIVE",
    entityType: "MedicineBatch",
    entityId: batch.id,
    metadata: {
      medicineId: medicine.id,
      medicineName: medicine.name,
      quantity: input.quantity,
      transactionId: transaction.id,
    },
  });

  return batch;
}
