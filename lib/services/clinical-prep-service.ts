import "server-only";
import { prisma } from "@/lib/db";
import { authorize } from "@/lib/auth/authorize";
import type { CurrentUser } from "@/lib/auth/session";
import type { ClinicalPreparationNoteInput } from "@/lib/validation/clinical-prep";

// Private to the student who wrote them - no logAudit call here on
// purpose. The audit log exists to reconstruct who touched the official
// clinical record and when; these notes are explicitly not part of that
// record, so they don't belong in that trail either.

export async function listMyPreparationNotes(user: CurrentUser | null) {
  const authedUser = await authorize(user, "clinical-prep:manage");

  return prisma.clinicalPreparationNote.findMany({
    where: { studentId: authedUser.id },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, mrnNumber: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createPreparationNote(
  user: CurrentUser | null,
  patientId: string,
  input: ClinicalPreparationNoteInput,
) {
  const authedUser = await authorize(user, "clinical-prep:manage");

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, deletedAt: null },
  });
  if (!patient) {
    throw new Error("Patient not found");
  }

  return prisma.clinicalPreparationNote.create({
    data: {
      studentId: authedUser.id,
      patientId: patient.id,
      content: input.content,
    },
  });
}
