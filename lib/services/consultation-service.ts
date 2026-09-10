import "server-only";
import { prisma } from "@/lib/db";
import { authorize } from "@/lib/auth/authorize";
import { logAudit } from "@/lib/audit/log";
import type { CurrentUser } from "@/lib/auth/session";
import type { ConsultationInput } from "@/lib/validation/consultation";

export async function listConsultationsForPatient(
  user: CurrentUser | null,
  patientId: string,
) {
  await authorize(user, "patient:read");

  return prisma.consultation.findMany({
    where: { patientId, deletedAt: null },
    include: {
      doctor: { select: { fullName: true } },
      vitals: true,
      diagnoses: true,
    },
    orderBy: { consultationDate: "desc" },
  });
}

const hasAnyVital = (input: ConsultationInput) =>
  [
    input.temperatureC,
    input.heartRateBpm,
    input.respiratoryRatePerMin,
    input.bloodPressureSystolic,
    input.bloodPressureDiastolic,
    input.oxygenSaturationPercent,
    input.weightKg,
    input.heightCm,
  ].some((v) => v !== undefined);

export async function createConsultation(
  user: CurrentUser | null,
  patientId: string,
  input: ConsultationInput,
) {
  const authedUser = await authorize(user, "consultation:create");

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, deletedAt: null },
  });
  if (!patient) {
    throw new Error("Patient not found");
  }

  const consultation = await prisma.consultation.create({
    data: {
      patientId: patient.id,
      doctorId: authedUser.id,
      chiefComplaint: input.chiefComplaint,
      historyOfPresentIllness: input.historyOfPresentIllness,
      examinationNotes: input.examinationNotes,
      assessment: input.assessment,
      treatmentNotes: input.treatmentNotes,
      notes: input.notes,
      ...(hasAnyVital(input)
        ? {
            vitals: {
              create: {
                temperatureC: input.temperatureC,
                heartRateBpm: input.heartRateBpm,
                respiratoryRatePerMin: input.respiratoryRatePerMin,
                bloodPressureSystolic: input.bloodPressureSystolic,
                bloodPressureDiastolic: input.bloodPressureDiastolic,
                oxygenSaturationPercent: input.oxygenSaturationPercent,
                weightKg: input.weightKg,
                heightCm: input.heightCm,
              },
            },
          }
        : {}),
      ...(input.diagnosisDescription
        ? {
            diagnoses: {
              create: {
                patientId: patient.id,
                description: input.diagnosisDescription,
              },
            },
          }
        : {}),
    },
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: "CONSULTATION_CREATE",
    entityType: "Consultation",
    entityId: consultation.id,
    metadata: { patientId: patient.id },
  });

  return consultation;
}
