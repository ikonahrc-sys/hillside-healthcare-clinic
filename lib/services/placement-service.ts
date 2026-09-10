import "server-only";
import { prisma } from "@/lib/db";
import { authorize } from "@/lib/auth/authorize";
import { logAudit } from "@/lib/audit/log";
import type { CurrentUser } from "@/lib/auth/session";
import type { CreatePlacementInput } from "@/lib/validation/placement";

function computeInitialStatus(startDate: Date, endDate: Date): "UPCOMING" | "ACTIVE" | "EXPIRED" {
  const now = new Date();
  if (now < startDate) return "UPCOMING";
  if (now > endDate) return "EXPIRED";
  return "ACTIVE";
}

export async function listPlacements(user: CurrentUser | null) {
  await authorize(user, "placement:manage");

  return prisma.clinicalPlacement.findMany({
    include: {
      student: { select: { fullName: true, email: true } },
      department: { select: { name: true } },
      supervisor: { select: { fullName: true } },
    },
    orderBy: { startDate: "desc" },
  });
}

export async function listStudentUsers(user: CurrentUser | null) {
  await authorize(user, "placement:manage");

  return prisma.user.findMany({
    where: { role: { name: "STUDENT" }, status: "ACTIVE" },
    select: { id: true, fullName: true, email: true },
    orderBy: { fullName: "asc" },
  });
}

export async function listPotentialSupervisors(user: CurrentUser | null) {
  await authorize(user, "placement:manage");

  return prisma.user.findMany({
    where: { role: { name: { not: "STUDENT" } }, status: "ACTIVE" },
    select: { id: true, fullName: true, email: true },
    orderBy: { fullName: "asc" },
  });
}

export async function createPlacement(
  user: CurrentUser | null,
  input: CreatePlacementInput,
) {
  const authedUser = await authorize(user, "placement:manage");

  const student = await prisma.user.findFirst({
    where: { id: input.studentId, role: { name: "STUDENT" } },
  });
  if (!student) {
    throw new Error("Selected student does not exist");
  }

  const department = await prisma.department.findUnique({
    where: { id: input.departmentId },
  });
  if (!department) {
    throw new Error("Selected department does not exist");
  }

  // Unlike student/department, this one was previously taken as-is from
  // the form with no existence check at all - a crafted request could
  // set any string as supervisorId, including a student's own id.
  if (input.supervisorId) {
    const supervisor = await prisma.user.findFirst({
      where: { id: input.supervisorId, role: { name: { not: "STUDENT" } } },
    });
    if (!supervisor) {
      throw new Error("Selected supervisor does not exist");
    }
  }

  // No overlapping placements for the same student - a student is on
  // exactly one placement at a time, regardless of that placement's
  // status label.
  const overlapping = await prisma.clinicalPlacement.findFirst({
    where: {
      studentId: student.id,
      startDate: { lte: input.endDate },
      endDate: { gte: input.startDate },
    },
  });
  if (overlapping) {
    throw new Error(
      "This student already has a placement that overlaps these dates.",
    );
  }

  const placement = await prisma.clinicalPlacement.create({
    data: {
      studentId: student.id,
      departmentId: department.id,
      supervisorId: input.supervisorId,
      startDate: input.startDate,
      endDate: input.endDate,
      clinicalArea: input.clinicalArea,
      status: computeInitialStatus(input.startDate, input.endDate),
    },
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: "PLACEMENT_CREATE",
    entityType: "ClinicalPlacement",
    entityId: placement.id,
    metadata: {
      studentId: student.id,
      departmentId: department.id,
      startDate: input.startDate,
      endDate: input.endDate,
    },
  });

  return placement;
}
