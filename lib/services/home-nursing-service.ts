import "server-only";
import { prisma } from "@/lib/db";
import { authorize } from "@/lib/auth/authorize";
import { logAudit } from "@/lib/audit/log";
import type { CurrentUser } from "@/lib/auth/session";
import type {
  HomeNursingAssessmentInput,
  HomeNursingCarePlanInput,
} from "@/lib/validation/home-nursing";

export async function listHomeNursingAssessmentsForPatient(
  user: CurrentUser | null,
  patientId: string,
) {
  await authorize(user, "patient:read");

  return prisma.homeNursingAssessment.findMany({
    where: { patientId },
    include: {
      nurse: { select: { fullName: true } },
      carePlan: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getHomeNursingAssessment(
  user: CurrentUser | null,
  assessmentId: string,
) {
  await authorize(user, "patient:read");

  return prisma.homeNursingAssessment.findUnique({
    where: { id: assessmentId },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, mrnNumber: true } },
      nurse: { select: { fullName: true } },
      carePlan: true,
    },
  });
}

export async function createHomeNursingAssessment(
  user: CurrentUser | null,
  patientId: string,
  input: HomeNursingAssessmentInput,
  referralId?: string,
) {
  const authedUser = await authorize(user, "homenursing:manage");

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, deletedAt: null },
  });
  if (!patient) {
    throw new Error("Patient not found");
  }

  const assessment = await prisma.homeNursingAssessment.create({
    data: {
      patientId: patient.id,
      referralId: referralId || null,
      nurseId: authedUser.id,
      findings: input.findings,
      careNeeds: input.careNeeds,
      precautions: input.precautions,
      notes: input.notes,
    },
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: "HOME_NURSING_ASSESSMENT_CREATE",
    entityType: "HomeNursingAssessment",
    entityId: assessment.id,
    metadata: { patientId: patient.id },
  });

  return assessment;
}

export async function createHomeNursingCarePlan(
  user: CurrentUser | null,
  assessmentId: string,
  input: HomeNursingCarePlanInput,
) {
  const authedUser = await authorize(user, "homenursing:manage");

  const assessment = await prisma.homeNursingAssessment.findUnique({
    where: { id: assessmentId },
  });
  if (!assessment) {
    throw new Error("Assessment not found");
  }

  const existing = await prisma.homeNursingCarePlan.findUnique({
    where: { assessmentId },
  });
  if (existing) {
    throw new Error("A care plan already exists for this assessment.");
  }

  const plan = await prisma.homeNursingCarePlan.create({
    data: {
      assessmentId: assessment.id,
      patientId: assessment.patientId,
      nurseId: authedUser.id,
      goals: input.goals,
      frequency: input.frequency,
      reviewDate: input.reviewDate,
      precautions: input.precautions,
    },
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: "HOME_NURSING_CARE_PLAN_CREATE",
    entityType: "HomeNursingCarePlan",
    entityId: plan.id,
    metadata: { patientId: assessment.patientId, assessmentId: assessment.id },
  });

  return plan;
}
