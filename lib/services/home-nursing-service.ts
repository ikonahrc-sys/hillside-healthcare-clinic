import "server-only";
import { prisma } from "@/lib/db";
import { authorize, requireAuthenticated, AuthorizationError } from "@/lib/auth/authorize";
import { authorizeClinicalAuthor } from "@/lib/auth/clinical-author";
import { logAudit } from "@/lib/audit/log";
import type { CurrentUser } from "@/lib/auth/session";
import type {
  HomeNursingAssessmentInput,
  HomeNursingCarePlanInput,
} from "@/lib/validation/home-nursing";
import type { HomeVisitInput } from "@/lib/validation/home-visit";

export async function listHomeNursingAssessmentsForPatient(
  user: CurrentUser | null,
  patientId: string,
) {
  await authorize(user, "patient:read");

  return prisma.homeNursingAssessment.findMany({
    where: { patientId },
    include: {
      nurse: { select: { fullName: true, role: { select: { name: true } } } },
      carePlan: {
        include: { nurse: { select: { role: { select: { name: true } } } } },
      },
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
      nurse: { select: { fullName: true, role: { select: { name: true } } } },
      coSignedBy: { select: { fullName: true } },
      carePlan: {
        include: {
          nurse: { select: { fullName: true, role: { select: { name: true } } } },
          coSignedBy: { select: { fullName: true } },
          homeVisits: {
            include: {
              nurse: { select: { fullName: true, role: { select: { name: true } } } },
              coSignedBy: { select: { fullName: true } },
            },
            orderBy: { visitDate: "desc" },
          },
        },
      },
    },
  });
}

export async function createHomeNursingAssessment(
  user: CurrentUser | null,
  patientId: string,
  input: HomeNursingAssessmentInput,
  referralId?: string,
) {
  const { authedUser, requiresCoSign } = await authorizeClinicalAuthor(
    user,
    "homenursing:manage",
    "HN",
  );

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
    metadata: { patientId: patient.id, studentAuthored: requiresCoSign },
  });

  return assessment;
}

export async function updateHomeNursingAssessment(
  user: CurrentUser | null,
  assessmentId: string,
  input: HomeNursingAssessmentInput,
) {
  const authedUser = requireAuthenticated(user);

  const assessment = await prisma.homeNursingAssessment.findUnique({
    where: { id: assessmentId },
  });
  if (!assessment) {
    throw new Error("Assessment not found");
  }
  if (assessment.nurseId !== authedUser.id) {
    throw new AuthorizationError("Only the original author can edit this record.");
  }
  if (assessment.coSignedAt) {
    throw new Error("This assessment has already been co-signed and can no longer be edited.");
  }

  const updated = await prisma.homeNursingAssessment.update({
    where: { id: assessmentId },
    data: {
      findings: input.findings,
      careNeeds: input.careNeeds,
      precautions: input.precautions,
      notes: input.notes,
    },
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: "HOME_NURSING_ASSESSMENT_UPDATE",
    entityType: "HomeNursingAssessment",
    entityId: assessment.id,
  });

  return updated;
}

export async function coSignHomeNursingAssessment(
  user: CurrentUser | null,
  assessmentId: string,
) {
  const authedUser = await authorize(user, "homenursing:manage");

  const assessment = await prisma.homeNursingAssessment.findUnique({
    where: { id: assessmentId },
    include: { nurse: { select: { role: { select: { name: true } } } } },
  });
  if (!assessment) {
    throw new Error("Assessment not found");
  }
  if (assessment.nurse.role.name !== "STUDENT") {
    throw new Error("This assessment does not require a co-sign.");
  }
  if (assessment.coSignedAt) {
    throw new Error("This assessment has already been co-signed.");
  }

  const updated = await prisma.homeNursingAssessment.update({
    where: { id: assessment.id },
    data: { coSignedByUserId: authedUser.id, coSignedAt: new Date() },
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: "HOME_NURSING_ASSESSMENT_COSIGN",
    entityType: "HomeNursingAssessment",
    entityId: assessment.id,
    metadata: { patientId: assessment.patientId, studentNurseId: assessment.nurseId },
  });

  return updated;
}

export async function createHomeNursingCarePlan(
  user: CurrentUser | null,
  assessmentId: string,
  input: HomeNursingCarePlanInput,
) {
  const { authedUser, requiresCoSign } = await authorizeClinicalAuthor(
    user,
    "homenursing:manage",
    "HN",
  );

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
    metadata: { patientId: assessment.patientId, assessmentId: assessment.id, studentAuthored: requiresCoSign },
  });

  return plan;
}

export async function updateHomeNursingCarePlan(
  user: CurrentUser | null,
  carePlanId: string,
  input: HomeNursingCarePlanInput,
) {
  const authedUser = requireAuthenticated(user);

  const plan = await prisma.homeNursingCarePlan.findUnique({
    where: { id: carePlanId },
  });
  if (!plan) {
    throw new Error("Care plan not found");
  }
  if (plan.nurseId !== authedUser.id) {
    throw new AuthorizationError("Only the original author can edit this record.");
  }
  if (plan.coSignedAt) {
    throw new Error("This care plan has already been co-signed and can no longer be edited.");
  }

  const updated = await prisma.homeNursingCarePlan.update({
    where: { id: carePlanId },
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
    action: "HOME_NURSING_CARE_PLAN_UPDATE",
    entityType: "HomeNursingCarePlan",
    entityId: plan.id,
  });

  return updated;
}

export async function coSignHomeNursingCarePlan(
  user: CurrentUser | null,
  carePlanId: string,
) {
  const authedUser = await authorize(user, "homenursing:manage");

  const plan = await prisma.homeNursingCarePlan.findUnique({
    where: { id: carePlanId },
    include: { nurse: { select: { role: { select: { name: true } } } } },
  });
  if (!plan) {
    throw new Error("Care plan not found");
  }
  if (plan.nurse.role.name !== "STUDENT") {
    throw new Error("This care plan does not require a co-sign.");
  }
  if (plan.coSignedAt) {
    throw new Error("This care plan has already been co-signed.");
  }

  const updated = await prisma.homeNursingCarePlan.update({
    where: { id: plan.id },
    data: { coSignedByUserId: authedUser.id, coSignedAt: new Date() },
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: "HOME_NURSING_CARE_PLAN_COSIGN",
    entityType: "HomeNursingCarePlan",
    entityId: plan.id,
    metadata: { patientId: plan.patientId, studentNurseId: plan.nurseId },
  });

  return updated;
}

export async function logHomeVisit(
  user: CurrentUser | null,
  carePlanId: string,
  input: HomeVisitInput,
) {
  const { authedUser, requiresCoSign } = await authorizeClinicalAuthor(
    user,
    "homenursing:manage",
    "HN",
  );

  const plan = await prisma.homeNursingCarePlan.findUnique({
    where: { id: carePlanId },
  });
  if (!plan) {
    throw new Error("Care plan not found");
  }

  const visit = await prisma.homeVisit.create({
    data: {
      carePlanId: plan.id,
      patientId: plan.patientId,
      nurseId: authedUser.id,
      careProvided: input.careProvided,
      patientCondition: input.patientCondition,
      notes: input.notes,
    },
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: "HOME_VISIT_LOG",
    entityType: "HomeVisit",
    entityId: visit.id,
    metadata: { patientId: plan.patientId, carePlanId: plan.id, studentAuthored: requiresCoSign },
  });

  return visit;
}

export async function updateHomeVisit(
  user: CurrentUser | null,
  visitId: string,
  input: HomeVisitInput,
) {
  const authedUser = requireAuthenticated(user);

  const visit = await prisma.homeVisit.findUnique({ where: { id: visitId } });
  if (!visit) {
    throw new Error("Home visit not found");
  }
  if (visit.nurseId !== authedUser.id) {
    throw new AuthorizationError("Only the original author can edit this record.");
  }
  if (visit.coSignedAt) {
    throw new Error("This home visit has already been co-signed and can no longer be edited.");
  }

  const updated = await prisma.homeVisit.update({
    where: { id: visitId },
    data: {
      careProvided: input.careProvided,
      patientCondition: input.patientCondition,
      notes: input.notes,
    },
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: "HOME_VISIT_UPDATE",
    entityType: "HomeVisit",
    entityId: visit.id,
  });

  return updated;
}

export async function coSignHomeVisit(
  user: CurrentUser | null,
  visitId: string,
) {
  const authedUser = await authorize(user, "homenursing:manage");

  const visit = await prisma.homeVisit.findUnique({
    where: { id: visitId },
    include: { nurse: { select: { role: { select: { name: true } } } } },
  });
  if (!visit) {
    throw new Error("Home visit not found");
  }
  if (visit.nurse.role.name !== "STUDENT") {
    throw new Error("This home visit does not require a co-sign.");
  }
  if (visit.coSignedAt) {
    throw new Error("This home visit has already been co-signed.");
  }

  const updated = await prisma.homeVisit.update({
    where: { id: visit.id },
    data: { coSignedByUserId: authedUser.id, coSignedAt: new Date() },
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: "HOME_VISIT_COSIGN",
    entityType: "HomeVisit",
    entityId: visit.id,
    metadata: { patientId: visit.patientId, studentNurseId: visit.nurseId },
  });

  return updated;
}

export async function listHomeVisitsForPatient(
  user: CurrentUser | null,
  patientId: string,
) {
  await authorize(user, "patient:read");

  return prisma.homeVisit.findMany({
    where: { patientId },
    include: { nurse: { select: { fullName: true, role: { select: { name: true } } } } },
    orderBy: { visitDate: "desc" },
  });
}
