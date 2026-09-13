import "server-only";
import { prisma } from "@/lib/db";
import { authorize } from "@/lib/auth/authorize";
import { logAudit } from "@/lib/audit/log";
import { getActivePlacementDepartment } from "@/lib/auth/placement";
import type { CurrentUser } from "@/lib/auth/session";
import type { PatientInput } from "@/lib/validation/patient";
import { formatMrn } from "@/lib/utils/mrn";

// Re-exported so every existing server-side caller can keep importing it
// from here - moved to lib/utils/mrn.ts because it's a plain string
// formatter with no server dependency, and a Client Component needs to use
// it too (importing it from this file would drag in "server-only" and the
// Postgres driver, which can't be bundled for the browser).
export { formatMrn };

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

// A patient "belongs" to a department for a student's purposes if they
// have a referral naming that department (either direction - the
// referring department gave the clinical context, the receiving
// department is who's actually treating them there), or a record of the
// type that department itself produces. Medical has no assessment/plan
// model of its own the way Rehab and Home Nursing do, so it's keyed off
// Consultation instead.
const DEPARTMENT_RECORD_FILTER: Record<string, object> = {
  MED: { consultations: { some: {} } },
  PHARM: { prescriptions: { some: {} } },
  REHAB: { rehabAssessments: { some: {} } },
  HN: { homeNursingAssessments: { some: {} } },
};

export async function getActiveStudentPlacement(user: CurrentUser) {
  return getActivePlacementDepartment(user.id);
}

// A student only sees patients relevant to whichever department their
// active placement is in - not every patient in the facility. This is
// the "broad department-scoped clinical access" the master prompt calls
// for: full read access to a patient's whole chart once they're in view
// (see listConsultationsForPatient etc., all gated only on patient:read),
// but which patients come into view at all is scoped by placement.
export async function listPatientsForStudent(user: CurrentUser) {
  await authorize(user, "patient:read");

  const department = await getActiveStudentPlacement(user);
  if (!department) {
    return [];
  }

  return prisma.patient.findMany({
    where: {
      deletedAt: null,
      OR: [
        {
          referrals: {
            some: {
              OR: [
                { fromDepartmentId: department.id },
                { toDepartmentId: department.id },
              ],
            },
          },
        },
        ...(DEPARTMENT_RECORD_FILTER[department.code]
          ? [DEPARTMENT_RECORD_FILTER[department.code]]
          : []),
      ],
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
