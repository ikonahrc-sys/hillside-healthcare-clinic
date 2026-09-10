"use server";

import { redirect } from "next/navigation";
import {
  rehabAssessmentSchema,
  rehabTreatmentPlanSchema,
} from "@/lib/validation/rehab";
import {
  createRehabAssessment,
  createTreatmentPlan,
} from "@/lib/services/rehab-service";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthorizationError } from "@/lib/auth/authorize";

export type RehabActionState = { error: string } | null;

export async function createRehabAssessmentAction(
  patientId: string,
  _prevState: RehabActionState,
  formData: FormData,
): Promise<RehabActionState> {
  const parsed = rehabAssessmentSchema.safeParse({
    discipline: formData.get("discipline"),
    findings: formData.get("findings"),
    functionalLimitations: formData.get("functionalLimitations"),
    goals: formData.get("goals"),
    precautions: formData.get("precautions"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const referralIdRaw = formData.get("referralId");
  const referralId = typeof referralIdRaw === "string" && referralIdRaw ? referralIdRaw : undefined;

  const user = await getCurrentUser();
  let assessmentId: string;

  try {
    const assessment = await createRehabAssessment(user, patientId, parsed.data, referralId);
    assessmentId = assessment.id;
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return { error: "You are not authorized to create rehabilitation assessments." };
    }
    if (e instanceof Error) {
      return { error: e.message };
    }
    throw e;
  }

  redirect(`/rehab-assessments/${assessmentId}`);
}

export async function createTreatmentPlanAction(
  assessmentId: string,
  _prevState: RehabActionState,
  formData: FormData,
): Promise<RehabActionState> {
  const parsed = rehabTreatmentPlanSchema.safeParse({
    goals: formData.get("goals"),
    frequency: formData.get("frequency"),
    reviewDate: formData.get("reviewDate"),
    precautions: formData.get("precautions"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = await getCurrentUser();

  try {
    await createTreatmentPlan(user, assessmentId, parsed.data);
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return { error: "You are not authorized to create treatment plans." };
    }
    if (e instanceof Error) {
      return { error: e.message };
    }
    throw e;
  }

  redirect(`/rehab-assessments/${assessmentId}`);
}
