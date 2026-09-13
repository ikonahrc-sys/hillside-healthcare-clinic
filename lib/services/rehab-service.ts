import "server-only";
import { prisma } from "@/lib/db";
import { authorize } from "@/lib/auth/authorize";
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
      discipline: input.discipline,
      findings: input.findings,
      functionalLimitations: input.functionalLimitations,
      goals: input.goals,
      precautions: input.precautions,
      notes: input.notes,
    },
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: "REHAB_ASSESSMENT_CREATE",
    entityType: "RehabAssessment",
    entityId: assessment.id,
    metadata: { patientId: patient.id, discipline: input.discipline, studentAuthored: requiresCoSign },
  });

  return assessment;
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
      activities: input.activities,
      setting: input.setting,
      progress: input.progress,
      notes: input.notes,
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
