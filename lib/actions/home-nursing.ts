"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  homeNursingAssessmentSchema,
  homeNursingCarePlanSchema,
} from "@/lib/validation/home-nursing";
import { homeVisitSchema } from "@/lib/validation/home-visit";
import {
  createHomeNursingAssessment,
  createHomeNursingCarePlan,
  logHomeVisit,
  coSignHomeNursingAssessment,
  coSignHomeNursingCarePlan,
  coSignHomeVisit,
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

export async function coSignHomeNursingAssessmentAction(formData: FormData) {
  const assessmentId = formData.get("assessmentId");
  if (typeof assessmentId !== "string") {
    return;
  }

  const user = await getCurrentUser();
  try {
    await coSignHomeNursingAssessment(user, assessmentId);
  } catch {
    // Most likely a race or a permission edge case - revalidating below
    // shows the current real state rather than crashing to an error page.
  } finally {
    revalidatePath(`/home-nursing-assessments/${assessmentId}`);
  }
}

export async function coSignHomeNursingCarePlanAction(formData: FormData) {
  const assessmentId = formData.get("assessmentId");
  const carePlanId = formData.get("carePlanId");
  if (typeof assessmentId !== "string" || typeof carePlanId !== "string") {
    return;
  }

  const user = await getCurrentUser();
  try {
    await coSignHomeNursingCarePlan(user, carePlanId);
  } catch {
    // Same reasoning as coSignHomeNursingAssessmentAction.
  } finally {
    revalidatePath(`/home-nursing-assessments/${assessmentId}`);
  }
}

export async function coSignHomeVisitAction(formData: FormData) {
  const assessmentId = formData.get("assessmentId");
  const visitId = formData.get("visitId");
  if (typeof assessmentId !== "string" || typeof visitId !== "string") {
    return;
  }

  const user = await getCurrentUser();
  try {
    await coSignHomeVisit(user, visitId);
  } catch {
    // Same reasoning as coSignHomeNursingAssessmentAction.
  } finally {
    revalidatePath(`/home-nursing-assessments/${assessmentId}`);
  }
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
