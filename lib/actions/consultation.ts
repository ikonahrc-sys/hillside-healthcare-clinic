"use server";

import { redirect } from "next/navigation";
import { consultationInputSchema } from "@/lib/validation/consultation";
import { createConsultation } from "@/lib/services/consultation-service";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthorizationError } from "@/lib/auth/authorize";

export type CreateConsultationState = { error: string } | null;

export async function createConsultationAction(
  patientId: string,
  _prevState: CreateConsultationState,
  formData: FormData,
): Promise<CreateConsultationState> {
  const parsed = consultationInputSchema.safeParse({
    chiefComplaint: formData.get("chiefComplaint"),
    historyOfPresentIllness: formData.get("historyOfPresentIllness"),
    examinationNotes: formData.get("examinationNotes"),
    assessment: formData.get("assessment"),
    treatmentNotes: formData.get("treatmentNotes"),
    notes: formData.get("notes"),
    diagnosisDescription: formData.get("diagnosisDescription"),
    temperatureC: formData.get("temperatureC"),
    heartRateBpm: formData.get("heartRateBpm"),
    respiratoryRatePerMin: formData.get("respiratoryRatePerMin"),
    bloodPressureSystolic: formData.get("bloodPressureSystolic"),
    bloodPressureDiastolic: formData.get("bloodPressureDiastolic"),
    oxygenSaturationPercent: formData.get("oxygenSaturationPercent"),
    weightKg: formData.get("weightKg"),
    heightCm: formData.get("heightCm"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = await getCurrentUser();

  try {
    await createConsultation(user, patientId, parsed.data);
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return { error: "You are not authorized to create consultations." };
    }
    throw e;
  }

  redirect(`/patients/${patientId}`);
}
