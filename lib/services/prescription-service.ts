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
