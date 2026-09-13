import "server-only";
import { prisma } from "@/lib/db";
import { authorize } from "@/lib/auth/authorize";
import { logAudit } from "@/lib/audit/log";
import type { CurrentUser } from "@/lib/auth/session";
import type {
  OutreachVisitInput,
  SurveillanceCaseInput,
} from "@/lib/validation/public-health";

export async function listOutreachVisits(user: CurrentUser | null) {
  await authorize(user, "publichealth:manage");

  return prisma.communityOutreachVisit.findMany({
    include: { staff: { select: { fullName: true } } },
    orderBy: { visitDate: "desc" },
  });
}

export async function createOutreachVisit(
  user: CurrentUser | null,
  input: OutreachVisitInput,
) {
  const authedUser = await authorize(user, "publichealth:manage");

  const visit = await prisma.communityOutreachVisit.create({
    data: {
      staffId: authedUser.id,
      visitDate: input.visitDate,
      location: input.location,
      activity: input.activity,
      peopleReached: input.peopleReached,
      notes: input.notes,
    },
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: "OUTREACH_VISIT_CREATE",
    entityType: "CommunityOutreachVisit",
    entityId: visit.id,
  });

  return visit;
}

export async function listSurveillanceCases(user: CurrentUser | null) {
  await authorize(user, "publichealth:manage");

  return prisma.diseaseSurveillanceCase.findMany({
    include: {
      reportedByUser: { select: { fullName: true } },
      patient: { select: { firstName: true, lastName: true, mrnNumber: true } },
    },
    orderBy: { reportDate: "desc" },
  });
}

export async function createSurveillanceCase(
  user: CurrentUser | null,
  input: SurveillanceCaseInput,
) {
  const authedUser = await authorize(user, "publichealth:manage");

  if (input.patientId) {
    const patient = await prisma.patient.findFirst({
      where: { id: input.patientId, deletedAt: null },
    });
    if (!patient) {
      throw new Error("Selected patient does not exist");
    }
  }

  const surveillanceCase = await prisma.diseaseSurveillanceCase.create({
    data: {
      reportedByUserId: authedUser.id,
      diseaseName: input.diseaseName,
      reportDate: input.reportDate,
      location: input.location,
      status: input.status,
      patientId: input.patientId,
      notes: input.notes,
    },
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: "SURVEILLANCE_CASE_CREATE",
    entityType: "DiseaseSurveillanceCase",
    entityId: surveillanceCase.id,
    metadata: { diseaseName: input.diseaseName, status: input.status },
  });

  return surveillanceCase;
}
