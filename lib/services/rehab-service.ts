import "server-only";
import { prisma } from "@/lib/db";
import { authorize } from "@/lib/auth/authorize";
import { logAudit } from "@/lib/audit/log";
import type { CurrentUser } from "@/lib/auth/session";
import type {
  RehabAssessmentInput,
  RehabTreatmentPlanInput,
} from "@/lib/validation/rehab";

export async function listRehabAssessmentsForPatient(
  user: CurrentUser | null,
  patientId: string,
) {
  await authorize(user, "patient:read");

  return prisma.rehabAssessment.findMany({
    where: { patientId },
    include: {
      therapist: { select: { fullName: true } },
      treatmentPlan: true,
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
      therapist: { select: { fullName: true } },
      treatmentPlan: true,
    },
  });
}

export async function createRehabAssessment(
  user: CurrentUser | null,
  patientId: string,
  input: RehabAssessmentInput,
  referralId?: string,
) {
  const authedUser = await authorize(user, "rehab:manage");

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
    metadata: { patientId: patient.id, discipline: input.discipline },
  });

  return assessment;
}

export async function createTreatmentPlan(
  user: CurrentUser | null,
  assessmentId: string,
  input: RehabTreatmentPlanInput,
) {
  const authedUser = await authorize(user, "rehab:manage");

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
    metadata: { patientId: assessment.patientId, assessmentId: assessment.id },
  });

  return plan;
}
