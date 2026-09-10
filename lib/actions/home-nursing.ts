"use server";

import { redirect } from "next/navigation";
import {
  homeNursingAssessmentSchema,
  homeNursingCarePlanSchema,
} from "@/lib/validation/home-nursing";
import { homeVisitSchema } from "@/lib/validation/home-visit";
import {
  createHomeNursingAssessment,
  createHomeNursingCarePlan,
  logHomeVisit,
} from "@/lib/services/home-nursing-service";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthorizationError } from "@/lib/auth/authorize";

export type HomeNursingActionState = { error: string } | null;

export async function createHomeNursingAssessmentAction(
  patientId: string,
  _prevState: HomeNursingActionState,
  formData: FormData,
): Promise<HomeNursingActionState> {
  const parsed = homeNursingAssessmentSchema.safeParse({
    findings: formData.get("findings"),
    careNeeds: formData.get("careNeeds"),
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
    const assessment = await createHomeNursingAssessment(user, patientId, parsed.data, referralId);
    assessmentId = assessment.id;
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return { error: "You are not authorized to create home nursing assessments." };
    }
    if (e instanceof Error) {
      return { error: e.message };
    }
    throw e;
  }

  redirect(`/home-nursing-assessments/${assessmentId}`);
}

export async function logHomeVisitAction(
  assessmentId: string,
  carePlanId: string,
  _prevState: HomeNursingActionState,
  formData: FormData,
): Promise<HomeNursingActionState> {
  const parsed = homeVisitSchema.safeParse({
    careProvided: formData.get("careProvided"),
    patientCondition: formData.get("patientCondition"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = await getCurrentUser();

  try {
    await logHomeVisit(user, carePlanId, parsed.data);
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return { error: "You are not authorized to log home visits." };
    }
    if (e instanceof Error) {
      return { error: e.message };
    }
    throw e;
  }

  redirect(`/home-nursing-assessments/${assessmentId}`);
}

export async function createHomeNursingCarePlanAction(
  assessmentId: string,
  _prevState: HomeNursingActionState,
  formData: FormData,
): Promise<HomeNursingActionState> {
  const parsed = homeNursingCarePlanSchema.safeParse({
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
    await createHomeNursingCarePlan(user, assessmentId, parsed.data);
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return { error: "You are not authorized to create care plans." };
    }
    if (e instanceof Error) {
      return { error: e.message };
    }
    throw e;
  }

  redirect(`/home-nursing-assessments/${assessmentId}`);
}
