import "server-only";
import { prisma } from "@/lib/db";
import { authorize } from "@/lib/auth/authorize";
import { logAudit } from "@/lib/audit/log";
import type { CurrentUser } from "@/lib/auth/session";
import type { PatientInput } from "@/lib/validation/patient";

export function formatMrn(mrnNumber: number): string {
  return `P${mrnNumber.toString().padStart(5, "0")}`;
}

export async function listPatients(user: CurrentUser | null, query?: string) {
  await authorize(user, "patient:read");

  const trimmedQuery = query?.trim();

  return prisma.patient.findMany({
    where: {
      deletedAt: null,
      ...(trimmedQuery
        ? {
            OR: [
              { firstName: { contains: trimmedQuery, mode: "insensitive" } },
              { lastName: { contains: trimmedQuery, mode: "insensitive" } },
              // mrnNumber is an int column - only attempt the numeric match
              // when the query actually looks like one, otherwise Prisma
              // throws trying to compare a non-numeric string to an int.
              ...(Number.isInteger(Number(trimmedQuery))
                ? [{ mrnNumber: Number(trimmedQuery) }]
                : []),
            ],
          }
        : {}),
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

export async function getPatientById(user: CurrentUser | null, id: string) {
  const authedUser = await authorize(user, "patient:read");

  const patient = await prisma.patient.findFirst({
    where: { id, deletedAt: null },
  });

  if (patient) {
    await logAudit({
      actorId: authedUser.id,
      actorEmail: authedUser.email,
      action: "PATIENT_VIEW",
      entityType: "Patient",
      entityId: patient.id,
    });
  }

  return patient;
}

export async function createPatient(
  user: CurrentUser | null,
  input: PatientInput,
) {
  const authedUser = await authorize(user, "patient:write");

  const patient = await prisma.patient.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      dateOfBirth: input.dateOfBirth,
      sex: input.sex,
      address: input.address || null,
      phone: input.phone || null,
      email: input.email || null,
      emergencyContactName: input.emergencyContactName || null,
      emergencyContactPhone: input.emergencyContactPhone || null,
      allergies: input.allergies || null,
      medicalHistoryNotes: input.medicalHistoryNotes || null,
    },
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: "PATIENT_CREATE",
    entityType: "Patient",
    entityId: patient.id,
    metadata: { mrn: formatMrn(patient.mrnNumber) },
  });

  return patient;
}
