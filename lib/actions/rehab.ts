"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  rehabAssessmentSchema,
  rehabTreatmentPlanSchema,
  PEDIATRIC_MILESTONES,
} from "@/lib/validation/rehab";
import { therapySessionSchema } from "@/lib/validation/therapy-session";
import {
  createRehabAssessment,
  createTreatmentPlan,
  logTherapySession,
  coSignRehabAssessment,
  coSignTreatmentPlan,
  coSignTherapySession,
  updateRehabAssessment,
  updateTreatmentPlan,
  updateTherapySession,
} from "@/lib/services/rehab-service";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthorizationError } from "@/lib/auth/authorize";

export type RehabActionState = { error: string } | null;

// Shared by create/update actions - every field across Hillside's three
// real evaluation forms, read from one FormData regardless of which
// evaluationType is actually selected (the ones that don't apply are just
// left blank in the form and come through empty).
function parseAssessmentFormData(formData: FormData) {
  const numOrUndefined = (key: string) => {
    const v = formData.get(key);
    return typeof v === "string" && v !== "" ? v : undefined;
  };
  const textList = (key: string) =>
    formData.getAll(key).filter((v): v is string => typeof v === "string" && v.trim() !== "");

  return {
    discipline: formData.get("discipline"),
    evaluationType: formData.get("evaluationType"),
    findings: formData.get("findings"),
    functionalLimitations: formData.get("functionalLimitations"),
    goals: formData.get("goals"),
    precautions: formData.get("precautions"),
    notes: formData.get("notes"),

    chiefComplaint: formData.get("chiefComplaint"),
    mechanismOfInjury: formData.get("mechanismOfInjury"),
    dateOfOnset: formData.get("dateOfOnset"),
    painType: formData.getAll("painType"),
    painAggravates: formData.get("painAggravates"),
    painRelieves: formData.get("painRelieves"),
    painTiming: formData.getAll("painTiming"),
    painTimingDetail: formData.get("painTimingDetail"),
    painLevelWorst: numOrUndefined("painLevelWorst"),
    painLevelBest: numOrUndefined("painLevelBest"),
    painLevelCurrent: numOrUndefined("painLevelCurrent"),
    homeEquipment: formData.get("homeEquipment"),
    socialHistory: formData.get("socialHistory"),
    medicationsAndTesting: formData.get("medicationsAndTesting"),
    medicalScreenFlags: formData.getAll("medicalScreenFlags"),
    sensoryExam: formData.get("sensoryExam"),
    reflexesExam: formData.get("reflexesExam"),
    patientGoals: formData.get("patientGoals"),
    postureExam: formData.get("postureExam"),
    palpationExam: formData.get("palpationExam"),
    gaitExam: formData.get("gaitExam"),
    balanceExam: formData.get("balanceExam"),
    fallsHistory: formData.get("fallsHistory"),
    strengthExam: formData.get("strengthExam"),
    romExam: formData.get("romExam"),
    specialTestsNote: formData.get("specialTestsNote"),
    furtherObjectiveTesting: formData.get("furtherObjectiveTesting"),
    ptRecommendedFrequency: formData.get("ptRecommendedFrequency"),
    initialTreatmentPlan: formData.get("initialTreatmentPlan"),
    referralsNote: formData.get("referralsNote"),
    shortTermGoals: textList("shortTermGoals"),
    longTermGoals: textList("longTermGoals"),

    vitalsBp: formData.get("vitalsBp"),
    vitalsHr: formData.get("vitalsHr"),
    vitalsO2: formData.get("vitalsO2"),
    vitalsTemp: formData.get("vitalsTemp"),
    priorTreatment: formData.get("priorTreatment"),
    generalHealth: formData.get("generalHealth"),
    priorFunctionalLevelAdUse: formData.get("priorFunctionalLevelAdUse"),
    bedMobilityExam: formData.get("bedMobilityExam"),
    transfersExam: formData.get("transfersExam"),
    adlsExam: formData.get("adlsExam"),
    motorExam: formData.get("motorExam"),
    coordinationExam: formData.get("coordinationExam"),
    fatigueExam: formData.get("fatigueExam"),
    confusionMemoryExam: formData.get("confusionMemoryExam"),
    hearingVisionSpeechExam: formData.get("hearingVisionSpeechExam"),
    otherNeuroFindings: formData.get("otherNeuroFindings"),

    village: formData.get("village"),
    caregiver1: formData.get("caregiver1"),
    caregiver2: formData.get("caregiver2"),
    secondaryConcern: formData.get("secondaryConcern"),
    birthHistory: formData.get("birthHistory"),
    milestoneHistoryNote: formData.get("milestoneHistoryNote"),
    relevantFamilyHistory: formData.get("relevantFamilyHistory"),
    relevantHomeEnvironment: formData.get("relevantHomeEnvironment"),
    babySleepingEnvironment: formData.get("babySleepingEnvironment"),
    familyGoals: formData.get("familyGoals"),
    behavioralObservation: formData.get("behavioralObservation"),
    followingDirections: formData.get("followingDirections"),
    strengthsNote: formData.get("strengthsNote"),
    milestonesComment: formData.get("milestonesComment"),
    grossMotorNote: formData.get("grossMotorNote"),
    neuromotorMuscleToneNote: formData.get("neuromotorMuscleToneNote"),
    sensorimotorNote: formData.get("sensorimotorNote"),
    activityLimitationsNote: formData.get("activityLimitationsNote"),
    assistiveDevicesPresent: formData.get("assistiveDevicesPresent"),
    assistiveDevicesRecommended: formData.get("assistiveDevicesRecommended"),
    ptDiagnosisPrognosisJustification: formData.get("ptDiagnosisPrognosisJustification"),

    milestones: PEDIATRIC_MILESTONES.map((name) => ({
      milestone: name,
      achieved: formData.get(`milestone_${name}_achieved`) === "on",
      assistLevel: formData.get(`milestone_${name}_assistLevel`),
    })),
  };
}

export async function createRehabAssessmentAction(
  patientId: string,
  _prevState: RehabActionState,
  formData: FormData,
): Promise<RehabActionState> {
  const parsed = rehabAssessmentSchema.safeParse(parseAssessmentFormData(formData));

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
    subjective: formData.get("subjective"),
    objective: formData.get("objective"),
    setting: formData.get("setting"),
    assessment: formData.get("assessment"),
    plan: formData.get("plan"),
    homeExerciseProgram: formData.get("homeExerciseProgram"),
    additionalNotes: formData.get("additionalNotes"),
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

export async function updateRehabAssessmentAction(
  assessmentId: string,
  _prevState: RehabActionState,
  formData: FormData,
): Promise<RehabActionState> {
  const parsed = rehabAssessmentSchema.safeParse(parseAssessmentFormData(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = await getCurrentUser();

  try {
    await updateRehabAssessment(user, assessmentId, parsed.data);
  } catch (e) {
    if (e instanceof Error) {
      return { error: e.message };
    }
    throw e;
  }

  redirect(`/rehab-assessments/${assessmentId}`);
}

export async function updateTreatmentPlanAction(
  assessmentId: string,
  treatmentPlanId: string,
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
    await updateTreatmentPlan(user, treatmentPlanId, parsed.data);
  } catch (e) {
    if (e instanceof Error) {
      return { error: e.message };
    }
    throw e;
  }

  redirect(`/rehab-assessments/${assessmentId}`);
}

export async function updateTherapySessionAction(
  assessmentId: string,
  sessionId: string,
  _prevState: RehabActionState,
  formData: FormData,
): Promise<RehabActionState> {
  const parsed = therapySessionSchema.safeParse({
    subjective: formData.get("subjective"),
    objective: formData.get("objective"),
    setting: formData.get("setting"),
    assessment: formData.get("assessment"),
    plan: formData.get("plan"),
    homeExerciseProgram: formData.get("homeExerciseProgram"),
    additionalNotes: formData.get("additionalNotes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = await getCurrentUser();

  try {
    await updateTherapySession(user, sessionId, parsed.data);
  } catch (e) {
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
