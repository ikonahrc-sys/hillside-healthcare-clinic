"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  rehabAssessmentSchema,
  rehabTreatmentPlanSchema,
} from "@/lib/validation/rehab";
import { therapySessionSchema } from "@/lib/validation/therapy-session";
import {
  createRehabAssessment,
  createTreatmentPlan,
  logTherapySession,
  coSignRehabAssessment,
  coSignTreatmentPlan,
  coSignTherapySession,
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

export async function logTherapySessionAction(
  assessmentId: string,
  treatmentPlanId: string,
  _prevState: RehabActionState,
  formData: FormData,
): Promise<RehabActionState> {
  const parsed = therapySessionSchema.safeParse({
    activities: formData.get("activities"),
    setting: formData.get("setting"),
    progress: formData.get("progress"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = await getCurrentUser();

  try {
    await logTherapySession(user, treatmentPlanId, parsed.data);
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return { error: "You are not authorized to log therapy sessions." };
    }
    if (e instanceof Error) {
      return { error: e.message };
    }
    throw e;
  }

  redirect(`/rehab-assessments/${assessmentId}`);
}

export async function coSignRehabAssessmentAction(formData: FormData) {
  const assessmentId = formData.get("assessmentId");
  if (typeof assessmentId !== "string") {
    return;
  }

  const user = await getCurrentUser();
  try {
    await coSignRehabAssessment(user, assessmentId);
  } catch {
    // Most likely a race (someone else already co-signed) or a permission
    // edge case - revalidating below shows the current real state rather
    // than crashing to an error page.
  } finally {
    revalidatePath(`/rehab-assessments/${assessmentId}`);
  }
}

export async function coSignTreatmentPlanAction(formData: FormData) {
  const assessmentId = formData.get("assessmentId");
  const treatmentPlanId = formData.get("treatmentPlanId");
  if (typeof assessmentId !== "string" || typeof treatmentPlanId !== "string") {
    return;
  }

  const user = await getCurrentUser();
  try {
    await coSignTreatmentPlan(user, treatmentPlanId);
  } catch {
    // Most likely a race or a permission edge case - revalidating below
    // shows the current real state rather than crashing to an error page.
  } finally {
    revalidatePath(`/rehab-assessments/${assessmentId}`);
  }
}

export async function coSignTherapySessionAction(formData: FormData) {
  const assessmentId = formData.get("assessmentId");
  const sessionId = formData.get("sessionId");
  if (typeof assessmentId !== "string" || typeof sessionId !== "string") {
    return;
  }

  const user = await getCurrentUser();
  try {
    await coSignTherapySession(user, sessionId);
  } catch {
    // Same reasoning as coSignTreatmentPlanAction.
  } finally {
    revalidatePath(`/rehab-assessments/${assessmentId}`);
  }
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
