import "server-only";
import { prisma } from "@/lib/db";
import { authorize, AuthorizationError } from "@/lib/auth/authorize";
import { logAudit } from "@/lib/audit/log";
import type { CurrentUser } from "@/lib/auth/session";
import type {
  ReferralInput,
  ReferralResponseInput,
} from "@/lib/validation/referral";

const referralInclude = {
  patient: { select: { id: true, firstName: true, lastName: true, mrnNumber: true } },
  fromDepartment: { select: { name: true } },
  toDepartment: { select: { name: true } },
  referringUser: { select: { fullName: true } },
} as const;

export async function listReferrals(user: CurrentUser | null) {
  const authedUser = await authorize(user, "referral:manage");

  // Administrators see everything; everyone else sees only referrals that
  // touch their own department, as either sender or receiver - RBAC alone
  // ("can this role manage referrals") doesn't express this, it's a
  // separate attribute-based scope layered on top, per our Phase 0 notes.
  const departmentFilter =
    authedUser.role.name === "ADMINISTRATOR" || !authedUser.departmentId
      ? {}
      : {
          OR: [
            { fromDepartmentId: authedUser.departmentId },
            { toDepartmentId: authedUser.departmentId },
          ],
        };

  return prisma.referral.findMany({
    where: departmentFilter,
    include: referralInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function listReferralsForPatient(
  user: CurrentUser | null,
  patientId: string,
) {
  await authorize(user, "patient:read");

  return prisma.referral.findMany({
    where: { patientId },
    include: {
      fromDepartment: { select: { name: true } },
      toDepartment: { select: { name: true, code: true } },
      referringUser: { select: { fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createReferral(
  user: CurrentUser | null,
  patientId: string,
  input: ReferralInput,
) {
  const authedUser = await authorize(user, "referral:manage");

  if (!authedUser.departmentId) {
    throw new Error("Your account has no department assigned - cannot create a referral.");
  }

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, deletedAt: null },
  });
  if (!patient) {
    throw new Error("Patient not found");
  }

  const toDepartment = await prisma.department.findUnique({
    where: { id: input.toDepartmentId },
  });
  if (!toDepartment) {
    throw new Error("Selected department does not exist");
  }

  const referral = await prisma.referral.create({
    data: {
      patientId: patient.id,
      fromDepartmentId: authedUser.departmentId,
      toDepartmentId: toDepartment.id,
      referringUserId: authedUser.id,
      reason: input.reason,
    },
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: "REFERRAL_CREATE",
    entityType: "Referral",
    entityId: referral.id,
    metadata: { patientId: patient.id, toDepartment: toDepartment.name },
  });

  return referral;
}

export async function respondToReferral(
  user: CurrentUser | null,
  referralId: string,
  input: ReferralResponseInput,
) {
  const authedUser = await authorize(user, "referral:manage");

  const referral = await prisma.referral.findUnique({
    where: { id: referralId },
  });
  if (!referral) {
    throw new Error("Referral not found");
  }

  const isAdmin = authedUser.role.name === "ADMINISTRATOR";
  if (!isAdmin && referral.toDepartmentId !== authedUser.departmentId) {
    throw new AuthorizationError(
      "You can only respond to referrals sent to your own department.",
    );
  }

  if (referral.status !== "PENDING") {
    throw new Error("This referral has already been responded to.");
  }

  const updated = await prisma.referral.update({
    where: { id: referral.id },
    data: {
      status: input.decision,
      respondedByUserId: authedUser.id,
      respondedAt: new Date(),
      responseNotes: input.responseNotes,
    },
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: input.decision === "ACCEPTED" ? "REFERRAL_ACCEPTED" : "REFERRAL_DECLINED",
    entityType: "Referral",
    entityId: referral.id,
  });

  return updated;
}
