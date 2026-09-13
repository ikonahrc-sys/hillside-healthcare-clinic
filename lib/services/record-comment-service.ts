import "server-only";
import { prisma } from "@/lib/db";
import { can, requireAuthenticated, AuthorizationError } from "@/lib/auth/authorize";
import { logAudit } from "@/lib/audit/log";
import type { CurrentUser } from "@/lib/auth/session";

// The six co-signable record types (see clinical-author.ts) all share
// this one comment thread implementation - a supervisor asking a student
// to correct a pending record, and the student replying, without either
// needing to be present at the same time. entityType/entityId is the same
// pointer pattern AuditLog already uses, not a real foreign key, since one
// shared model covers all six rather than a table each.
export const COMMENTABLE_ENTITY_TYPES = [
  "RehabAssessment",
  "RehabTreatmentPlan",
  "TherapySession",
  "HomeNursingAssessment",
  "HomeNursingCarePlan",
  "HomeVisit",
] as const;

export type CommentableEntityType = (typeof COMMENTABLE_ENTITY_TYPES)[number];

async function getRecordAuthorAndPermission(
  entityType: CommentableEntityType,
  entityId: string,
): Promise<{ authorId: string; permissionKey: string } | null> {
  switch (entityType) {
    case "RehabAssessment": {
      const r = await prisma.rehabAssessment.findUnique({
        where: { id: entityId },
        select: { therapistId: true },
      });
      return r ? { authorId: r.therapistId, permissionKey: "rehab:manage" } : null;
    }
    case "RehabTreatmentPlan": {
      const r = await prisma.rehabTreatmentPlan.findUnique({
        where: { id: entityId },
        select: { therapistId: true },
      });
      return r ? { authorId: r.therapistId, permissionKey: "rehab:manage" } : null;
    }
    case "TherapySession": {
      const r = await prisma.therapySession.findUnique({
        where: { id: entityId },
        select: { therapistId: true },
      });
      return r ? { authorId: r.therapistId, permissionKey: "rehab:manage" } : null;
    }
    case "HomeNursingAssessment": {
      const r = await prisma.homeNursingAssessment.findUnique({
        where: { id: entityId },
        select: { nurseId: true },
      });
      return r ? { authorId: r.nurseId, permissionKey: "homenursing:manage" } : null;
    }
    case "HomeNursingCarePlan": {
      const r = await prisma.homeNursingCarePlan.findUnique({
        where: { id: entityId },
        select: { nurseId: true },
      });
      return r ? { authorId: r.nurseId, permissionKey: "homenursing:manage" } : null;
    }
    case "HomeVisit": {
      const r = await prisma.homeVisit.findUnique({
        where: { id: entityId },
        select: { nurseId: true },
      });
      return r ? { authorId: r.nurseId, permissionKey: "homenursing:manage" } : null;
    }
  }
}

// Whoever can co-sign the record (holds the department's manage
// permission) or wrote it in the first place can see/join its comment
// thread - the same two-sided audience the correction conversation is
// actually between.
async function assertCanAccess(
  authedUser: CurrentUser,
  entityType: CommentableEntityType,
  entityId: string,
) {
  const record = await getRecordAuthorAndPermission(entityType, entityId);
  if (!record) {
    throw new Error("Record not found");
  }

  const isManager = await can(authedUser, record.permissionKey);
  const isAuthor = record.authorId === authedUser.id;
  if (!isManager && !isAuthor) {
    throw new AuthorizationError("Not authorized to view or comment on this record");
  }
}

export async function listComments(
  user: CurrentUser | null,
  entityType: CommentableEntityType,
  entityId: string,
) {
  const authedUser = requireAuthenticated(user);
  await assertCanAccess(authedUser, entityType, entityId);

  return prisma.recordComment.findMany({
    where: { entityType, entityId },
    include: { author: { select: { fullName: true, role: { select: { name: true } } } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function addComment(
  user: CurrentUser | null,
  entityType: CommentableEntityType,
  entityId: string,
  content: string,
) {
  const authedUser = requireAuthenticated(user);
  await assertCanAccess(authedUser, entityType, entityId);

  const comment = await prisma.recordComment.create({
    data: { entityType, entityId, authorId: authedUser.id, content },
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: "RECORD_COMMENT_ADD",
    entityType,
    entityId,
  });

  return comment;
}
