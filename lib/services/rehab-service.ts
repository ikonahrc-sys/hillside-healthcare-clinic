import "server-only";
import { prisma } from "@/lib/db";
import { authorize, requireAuthenticated, AuthorizationError } from "@/lib/auth/authorize";
import { authorizeClinicalAuthor } from "@/lib/auth/clinical-author";
import { logAudit } from "@/lib/audit/log";
import type { CurrentUser } from "@/lib/auth/session";
import type {
  RehabAssessmentInput,
  RehabTreatmentPlanInput,
} from "@/lib/validation/rehab";
import type { TherapySessionInput } from "@/lib/validation/therapy-session";

export async function listRehabAssessmentsForPatient(
  user: CurrentUser | null,
  patientId: string,
) {
  await authorize(user, "patient:read");

  return prisma.rehabAssessment.findMany({
    where: { patientId },
    include: {
      therapist: { select: { fullName: true, role: { select: { name: true } } } },
      treatmentPlan: {
        include: { therapist: { select: { role: { select: { name: true } } } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRehabAssessment(
  user: CurrentUser | null,
  assessmentId: string,
) {
  await authorize(user, "patient:read");

  return prisma.rehabAssessment.findUnique({
    where: { id: assessmentId },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, mrnNumber: true } },
      therapist: { select: { fullName: true, role: { select: { name: true } } } },
      coSignedBy: { select: { fullName: true } },
      milestones: true,
      treatmentPlan: {
        include: {
          therapist: { select: { fullName: true, role: { select: { name: true } } } },
          coSignedBy: { select: { fullName: true } },
          therapySessions: {
            include: {
              therapist: { select: { fullName: true, role: { select: { name: true } } } },
              coSignedBy: { select: { fullName: true } },
            },
            orderBy: { sessionDate: "desc" },
          },
        },
      },
    },
  });
}

// Shared by createRehabAssessment/updateRehabAssessment - every field the
// three real evaluation forms can populate, minus the ones that differ
// between create and update (patientId/referralId/therapistId, and
// milestones, which need list-replacement handling of their own).
function buildAssessmentFieldData(input: RehabAssessmentInput) {
  return {
    discipline: input.discipline,
    evaluationType: input.evaluationType,
    findings: input.findings,
    functionalLimitations: input.functionalLimitations,
    goals: input.goals,
    precautions: input.precautions,
    notes: input.notes,

    chiefComplaint: input.chiefComplaint,
    mechanismOfInjury: input.mechanismOfInjury,
    dateOfOnset: input.dateOfOnset,
    painType: input.painType,
    painAggravates: input.painAggravates,
    painRelieves: input.painRelieves,
    painTiming: input.painTiming,
    painTimingDetail: input.painTimingDetail,
    painLevelWorst: input.painLevelWorst,
    painLevelBest: input.painLevelBest,
    painLevelCurrent: input.painLevelCurrent,
    homeEquipment: input.homeEquipment,
    socialHistory: input.socialHistory,
    medicationsAndTesting: input.medicationsAndTesting,
    medicalScreenFlags: input.medicalScreenFlags,
    sensoryExam: input.sensoryExam,
    reflexesExam: input.reflexesExam,
    patientGoals: input.patientGoals,
    postureExam: input.postureExam,
    palpationExam: input.palpationExam,
    gaitExam: input.gaitExam,
    balanceExam: input.balanceExam,
    fallsHistory: input.fallsHistory,
    strengthExam: input.strengthExam,
    romExam: input.romExam,
    specialTestsNote: input.specialTestsNote,
    furtherObjectiveTesting: input.furtherObjectiveTesting,
    ptRecommendedFrequency: input.ptRecommendedFrequency,
    initialTreatmentPlan: input.initialTreatmentPlan,
    referralsNote: input.referralsNote,
    shortTermGoals: input.shortTermGoals,
    longTermGoals: input.longTermGoals,

    vitalsBp: input.vitalsBp,
    vitalsHr: input.vitalsHr,
    vitalsO2: input.vitalsO2,
    vitalsTemp: input.vitalsTemp,
    priorTreatment: input.priorTreatment,
    generalHealth: input.generalHealth,
    priorFunctionalLevelAdUse: input.priorFunctionalLevelAdUse,
    bedMobilityExam: input.bedMobilityExam,
    transfersExam: input.transfersExam,
    adlsExam: input.adlsExam,
    motorExam: input.motorExam,
    coordinationExam: input.coordinationExam,
    fatigueExam: input.fatigueExam,
    confusionMemoryExam: input.confusionMemoryExam,
    hearingVisionSpeechExam: input.hearingVisionSpeechExam,
    otherNeuroFindings: input.otherNeuroFindings,

    village: input.village,
    caregiver1: input.caregiver1,
    caregiver2: input.caregiver2,
    secondaryConcern: input.secondaryConcern,
    birthHistory: input.birthHistory,
    milestoneHistoryNote: input.milestoneHistoryNote,
    relevantFamilyHistory: input.relevantFamilyHistory,
    relevantHomeEnvironment: input.relevantHomeEnvironment,
    babySleepingEnvironment: input.babySleepingEnvironment,
    familyGoals: input.familyGoals,
    behavioralObservation: input.behavioralObservation,
    followingDirections: input.followingDirections,
    strengthsNote: input.strengthsNote,
    milestonesComment: input.milestonesComment,
    grossMotorNote: input.grossMotorNote,
    neuromotorMuscleToneNote: input.neuromotorMuscleToneNote,
    sensorimotorNote: input.sensorimotorNote,
    activityLimitationsNote: input.activityLimitationsNote,
    assistiveDevicesPresent: input.assistiveDevicesPresent,
    assistiveDevicesRecommended: input.assistiveDevicesRecommended,
    ptDiagnosisPrognosisJustification: input.ptDiagnosisPrognosisJustification,
  };
}

export async function createRehabAssessment(
  user: CurrentUser | null,
  patientId: string,
  input: RehabAssessmentInput,
  referralId?: string,
) {
  const { authedUser, requiresCoSign } = await authorizeClinicalAuthor(
    user,
    "rehab:manage",
    "REHAB",
  );

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, deletedAt: null },
  });
  if (!patient) {
    throw new Error("Patient not found");
  }

  const assessment = await prisma.rehabAssessment.create({
    data: {
      patientId: patient.id,
      referralId: referralId || null,
      therapistId: authedUser.id,
      ...buildAssessmentFieldData(input),
      milestones: input.milestones.length
        ? { createMany: { data: input.milestones } }
        : undefined,
    },
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: "REHAB_ASSESSMENT_CREATE",
    entityType: "RehabAssessment",
    entityId: assessment.id,
    metadata: {
      patientId: patient.id,
      discipline: input.discipline,
      evaluationType: input.evaluationType,
      studentAuthored: requiresCoSign,
    },
  });

  return assessment;
}

// Lets the original author revise their own not-yet-co-signed record - a
// supervisor's comment asking for a correction has nowhere else to lead,
// since nothing else in this app allows editing after creation. The
// moment it's co-signed it becomes just as permanently locked as every
// other official record - this is only ever a pre-signature window.
export async function updateRehabAssessment(
  user: CurrentUser | null,
  assessmentId: string,
  input: RehabAssessmentInput,
) {
  const authedUser = requireAuthenticated(user);

  const assessment = await prisma.rehabAssessment.findUnique({
    where: { id: assessmentId },
  });
  if (!assessment) {
    throw new Error("Assessment not found");
  }
  if (assessment.therapistId !== authedUser.id) {
    throw new AuthorizationError("Only the original author can edit this record.");
  }
  if (assessment.coSignedAt) {
    throw new Error("This assessment has already been co-signed and can no longer be edited.");
  }

  // Milestones are a small, fully-replaceable list - simplest correct way
  // to handle "the student re-submits the whole checklist" is delete and
  // recreate rather than diffing individual rows.
  const updated = await prisma.rehabAssessment.update({
    where: { id: assessmentId },
    data: {
      ...buildAssessmentFieldData(input),
      milestones: {
        deleteMany: {},
        createMany: input.milestones.length ? { data: input.milestones } : undefined,
      },
    },
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: "REHAB_ASSESSMENT_UPDATE",
    entityType: "RehabAssessment",
    entityId: assessment.id,
  });

  return updated;
}

export async function coSignRehabAssessment(
  user: CurrentUser | null,
  assessmentId: string,
) {
  const authedUser = await authorize(user, "rehab:manage");

  const assessment = await prisma.rehabAssessment.findUnique({
    where: { id: assessmentId },
    include: { therapist: { select: { role: { select: { name: true } } } } },
  });
  if (!assessment) {
    throw new Error("Assessment not found");
  }
  if (assessment.therapist.role.name !== "STUDENT") {
    throw new Error("This assessment does not require a co-sign.");
  }
  if (assessment.coSignedAt) {
    throw new Error("This assessment has already been co-signed.");
  }

  const updated = await prisma.rehabAssessment.update({
    where: { id: assessment.id },
    data: { coSignedByUserId: authedUser.id, coSignedAt: new Date() },
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: "REHAB_ASSESSMENT_COSIGN",
    entityType: "RehabAssessment",
    entityId: assessment.id,
    metadata: { patientId: assessment.patientId, studentTherapistId: assessment.therapistId },
  });

  return updated;
}

export async function createTreatmentPlan(
  user: CurrentUser | null,
  assessmentId: string,
  input: RehabTreatmentPlanInput,
) {
  const { authedUser, requiresCoSign } = await authorizeClinicalAuthor(
    user,
    "rehab:manage",
    "REHAB",
  );

  const assessment = await prisma.rehabAssessment.findUnique({
    where: { id: assessmentId },
  });
  if (!assessment) {
    throw new Error("Assessment not found");
  }

  const existing = await prisma.rehabTreatmentPlan.findUnique({
    where: { assessmentId },
  });
  if (existing) {
    throw new Error("A treatment plan already exists for this assessment.");
  }

  const plan = await prisma.rehabTreatmentPlan.create({
    data: {
      assessmentId: assessment.id,
      patientId: assessment.patientId,
      therapistId: authedUser.id,
      goals: input.goals,
      frequency: input.frequency,
      reviewDate: input.reviewDate,
      precautions: input.precautions,
    },
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: "REHAB_TREATMENT_PLAN_CREATE",
    entityType: "RehabTreatmentPlan",
    entityId: plan.id,
    metadata: { patientId: assessment.patientId, assessmentId: assessment.id, studentAuthored: requiresCoSign },
  });

  return plan;
}

export async function updateTreatmentPlan(
  user: CurrentUser | null,
  treatmentPlanId: string,
  input: RehabTreatmentPlanInput,
) {
  const authedUser = requireAuthenticated(user);

  const plan = await prisma.rehabTreatmentPlan.findUnique({
    where: { id: treatmentPlanId },
  });
  if (!plan) {
    throw new Error("Treatment plan not found");
  }
  if (plan.therapistId !== authedUser.id) {
    throw new AuthorizationError("Only the original author can edit this record.");
  }
  if (plan.coSignedAt) {
    throw new Error("This treatment plan has already been co-signed and can no longer be edited.");
  }

  const updated = await prisma.rehabTreatmentPlan.update({
    where: { id: treatmentPlanId },
    data: {
      goals: input.goals,
      frequency: input.frequency,
      reviewDate: input.reviewDate,
      precautions: input.precautions,
    },
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: "REHAB_TREATMENT_PLAN_UPDATE",
    entityType: "RehabTreatmentPlan",
    entityId: plan.id,
  });

  return updated;
}

export async function coSignTreatmentPlan(
  user: CurrentUser | null,
  treatmentPlanId: string,
) {
  const authedUser = await authorize(user, "rehab:manage");

  const plan = await prisma.rehabTreatmentPlan.findUnique({
    where: { id: treatmentPlanId },
    include: { therapist: { select: { role: { select: { name: true } } } } },
  });
  if (!plan) {
    throw new Error("Treatment plan not found");
  }
  if (plan.therapist.role.name !== "STUDENT") {
    throw new Error("This treatment plan does not require a co-sign.");
  }
  if (plan.coSignedAt) {
    throw new Error("This treatment plan has already been co-signed.");
  }

  const updated = await prisma.rehabTreatmentPlan.update({
    where: { id: plan.id },
    data: { coSignedByUserId: authedUser.id, coSignedAt: new Date() },
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: "REHAB_TREATMENT_PLAN_COSIGN",
    entityType: "RehabTreatmentPlan",
    entityId: plan.id,
    metadata: { patientId: plan.patientId, studentTherapistId: plan.therapistId },
  });

  return updated;
}

export async function logTherapySession(
  user: CurrentUser | null,
  treatmentPlanId: string,
  input: TherapySessionInput,
) {
  const { authedUser, requiresCoSign } = await authorizeClinicalAuthor(
    user,
    "rehab:manage",
    "REHAB",
  );

  const plan = await prisma.rehabTreatmentPlan.findUnique({
    where: { id: treatmentPlanId },
  });
  if (!plan) {
    throw new Error("Treatment plan not found");
  }

  const session = await prisma.therapySession.create({
    data: {
      treatmentPlanId: plan.id,
      patientId: plan.patientId,
      therapistId: authedUser.id,
      subjective: input.subjective,
      objective: input.objective,
      setting: input.setting,
      assessment: input.assessment,
      plan: input.plan,
      homeExerciseProgram: input.homeExerciseProgram,
      additionalNotes: input.additionalNotes,
    },
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: "THERAPY_SESSION_LOG",
    entityType: "TherapySession",
    entityId: session.id,
    metadata: { patientId: plan.patientId, treatmentPlanId: plan.id, studentAuthored: requiresCoSign },
  });

  return session;
}

export async function updateTherapySession(
  user: CurrentUser | null,
  sessionId: string,
  input: TherapySessionInput,
) {
  const authedUser = requireAuthenticated(user);

  const session = await prisma.therapySession.findUnique({
    where: { id: sessionId },
  });
  if (!session) {
    throw new Error("Therapy session not found");
  }
  if (session.therapistId !== authedUser.id) {
    throw new AuthorizationError("Only the original author can edit this record.");
  }
  if (session.coSignedAt) {
    throw new Error("This therapy session has already been co-signed and can no longer be edited.");
  }

  const updated = await prisma.therapySession.update({
    where: { id: sessionId },
    data: {
      subjective: input.subjective,
      objective: input.objective,
      setting: input.setting,
      assessment: input.assessment,
      plan: input.plan,
      homeExerciseProgram: input.homeExerciseProgram,
      additionalNotes: input.additionalNotes,
    },
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: "THERAPY_SESSION_UPDATE",
    entityType: "TherapySession",
    entityId: session.id,
  });

  return updated;
}

export async function coSignTherapySession(
  user: CurrentUser | null,
  sessionId: string,
) {
  const authedUser = await authorize(user, "rehab:manage");

  const session = await prisma.therapySession.findUnique({
    where: { id: sessionId },
    include: { therapist: { select: { role: { select: { name: true } } } } },
  });
  if (!session) {
    throw new Error("Therapy session not found");
  }
  if (session.therapist.role.name !== "STUDENT") {
    throw new Error("This therapy session does not require a co-sign.");
  }
  if (session.coSignedAt) {
    throw new Error("This therapy session has already been co-signed.");
  }

  const updated = await prisma.therapySession.update({
    where: { id: session.id },
    data: { coSignedByUserId: authedUser.id, coSignedAt: new Date() },
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: "THERAPY_SESSION_COSIGN",
    entityType: "TherapySession",
    entityId: session.id,
    metadata: { patientId: session.patientId, studentTherapistId: session.therapistId },
  });

  return updated;
}

export async function listTherapySessionsForPatient(
  user: CurrentUser | null,
  patientId: string,
) {
  await authorize(user, "patient:read");

  return prisma.therapySession.findMany({
    where: { patientId },
    include: { therapist: { select: { fullName: true, role: { select: { name: true } } } } },
    orderBy: { sessionDate: "desc" },
  });
}
