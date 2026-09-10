import "server-only";
import { prisma } from "@/lib/db";
import { authorize, requireAuthenticated } from "@/lib/auth/authorize";
import { logAudit } from "@/lib/audit/log";
import type { CurrentUser } from "@/lib/auth/session";
import type { PrescriptionInput } from "@/lib/validation/prescription";

export async function listMedicines(user: CurrentUser | null) {
  requireAuthenticated(user);
  return prisma.medicine.findMany({ orderBy: { name: "asc" } });
}

export async function listPrescriptionsForPatient(
  user: CurrentUser | null,
  patientId: string,
) {
  await authorize(user, "patient:read");

  return prisma.prescription.findMany({
    where: { patientId },
    include: {
      prescribedByUser: { select: { fullName: true } },
      items: { include: { medicine: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createPrescription(
  user: CurrentUser | null,
  patientId: string,
  input: PrescriptionInput,
) {
  const authedUser = await authorize(user, "prescription:create");

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, deletedAt: null },
  });
  if (!patient) {
    throw new Error("Patient not found");
  }

  const medicineIds = input.itemsJson.map((item) => item.medicineId);
  const foundMedicines = await prisma.medicine.findMany({
    where: { id: { in: medicineIds } },
  });
  if (foundMedicines.length !== new Set(medicineIds).size) {
    throw new Error("One or more selected medicines could not be found");
  }

  const prescription = await prisma.prescription.create({
    data: {
      patientId: patient.id,
      prescribedByUserId: authedUser.id,
      notes: input.notes,
      items: {
        create: input.itemsJson.map((item) => ({
          medicineId: item.medicineId,
          dosageInstructions: item.dosageInstructions,
          quantity: item.quantity,
        })),
      },
    },
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: "PRESCRIPTION_CREATE",
    entityType: "Prescription",
    entityId: prescription.id,
    metadata: { patientId: patient.id, itemCount: input.itemsJson.length },
  });

  return prescription;
}

export async function listPrescriptionQueue(user: CurrentUser | null) {
  await authorize(user, "prescription:dispense");

  return prisma.prescription.findMany({
    where: { status: { in: ["PENDING", "PROCESSING"] } },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, mrnNumber: true } },
      items: { include: { medicine: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getPrescriptionForDispensing(
  user: CurrentUser | null,
  prescriptionId: string,
) {
  await authorize(user, "prescription:dispense");

  return prisma.prescription.findUnique({
    where: { id: prescriptionId },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, mrnNumber: true } },
      prescribedByUser: { select: { fullName: true } },
      items: {
        include: {
          medicine: {
            include: {
              // Non-expired batches with any stock; each item's actual
              // sufficiency (quantityOnHand >= item.quantity) is checked
              // in the UI/service per item, not here - a single medicine
              // can have items of differing quantities across the same
              // prescription or across prescriptions.
              batches: {
                where: { expiryDate: { gt: new Date() }, quantityOnHand: { gt: 0 } },
                orderBy: { expiryDate: "asc" },
              },
            },
          },
          dispensedFromBatch: true,
          dispensedByUser: { select: { fullName: true } },
        },
      },
    },
  });
}

export async function dispensePrescriptionItem(
  user: CurrentUser | null,
  itemId: string,
  batchId: string,
) {
  const authedUser = await authorize(user, "prescription:dispense");

  const item = await prisma.prescriptionItem.findUnique({ where: { id: itemId } });
  if (!item) {
    throw new Error("Prescription item not found");
  }
  if (item.dispensedAt) {
    throw new Error("This item has already been dispensed");
  }

  const batch = await prisma.medicineBatch.findUnique({ where: { id: batchId } });
  if (!batch || batch.medicineId !== item.medicineId) {
    throw new Error("Invalid batch for this medicine");
  }
  if (batch.expiryDate <= new Date()) {
    throw new Error("This batch has expired");
  }
  if (batch.quantityOnHand < item.quantity) {
    throw new Error("Insufficient stock in this batch");
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.medicineBatch.update({
      where: { id: batch.id },
      data: { quantityOnHand: { decrement: item.quantity } },
    });

    await tx.inventoryTransaction.create({
      data: {
        medicineBatchId: batch.id,
        type: "DISPENSED",
        quantityChange: -item.quantity,
        performedByUserId: authedUser.id,
        relatedPrescriptionItemId: item.id,
      },
    });

    await tx.prescriptionItem.update({
      where: { id: item.id },
      data: {
        dispensedAt: now,
        dispensedFromBatchId: batch.id,
        dispensedByUserId: authedUser.id,
      },
    });

    // The parent Prescription's status is derived from how many of its
    // items are actually dispensed, not set directly by this click - a
    // prescription with some items out of stock should read PROCESSING,
    // not silently jump to DISPENSED.
    const allItems = await tx.prescriptionItem.findMany({
      where: { prescriptionId: item.prescriptionId },
      select: { dispensedAt: true },
    });
    const dispensedCount = allItems.filter((i) => i.dispensedAt !== null).length;
    const newStatus: "PENDING" | "PROCESSING" | "DISPENSED" =
      dispensedCount === allItems.length
        ? "DISPENSED"
        : dispensedCount > 0
          ? "PROCESSING"
          : "PENDING";

    await tx.prescription.update({
      where: { id: item.prescriptionId },
      data: { status: newStatus },
    });
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: "PRESCRIPTION_ITEM_DISPENSE",
    entityType: "PrescriptionItem",
    entityId: item.id,
    metadata: {
      batchId: batch.id,
      medicineId: item.medicineId,
      quantity: item.quantity,
      prescriptionId: item.prescriptionId,
    },
  });

  return { itemId: item.id };
}
