import "server-only";
import { prisma } from "@/lib/db";
import { authorize, AuthorizationError } from "@/lib/auth/authorize";
import { logAudit } from "@/lib/audit/log";
import type { CurrentUser } from "@/lib/auth/session";
import type { CreatePlacementInput } from "@/lib/validation/placement";

function computeInitialStatus(startDate: Date, endDate: Date): "UPCOMING" | "ACTIVE" | "EXPIRED" {
  const now = new Date();
  if (now < startDate) return "UPCOMING";
  if (now > endDate) return "EXPIRED";
  return "ACTIVE";
}

// Administrator manages placements across every department. Every other
// placement:manage holder is a department Director/Head (see
// prisma/seed.ts's ROLE_PERMISSIONS) and is scoped to their own department
// only - null means unrestricted.
function scopeDepartmentId(user: CurrentUser): string | null {
  if (user.role.name === "ADMINISTRATOR") return null;
  return user.departmentId;
}

export async function listPlacements(user: CurrentUser | null) {
  const authedUser = await authorize(user, "placement:manage");
  const scopeId = scopeDepartmentId(authedUser);

  return prisma.clinicalPlacement.findMany({
    where: scopeId ? { departmentId: scopeId } : undefined,
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

  const scopeId = scopeDepartmentId(authedUser);
  if (scopeId && department.id !== scopeId) {
    throw new Error("You can only create placements within your own department.");
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

// For a department Director/Head's dashboard widget - their own
// department's placements that haven't ended yet, not the full admin
// history view listPlacements gives. Administrator has no single "own
// department" for this to mean anything, so it returns nothing for them
// rather than the whole facility.
export async function listActiveDepartmentPlacements(user: CurrentUser | null) {
  const authedUser = await authorize(user, "placement:manage");
  const scopeId = scopeDepartmentId(authedUser);
  if (!scopeId) return [];

  return prisma.clinicalPlacement.findMany({
    where: { departmentId: scopeId, endDate: { gte: new Date() }, status: { not: "SUSPENDED" } },
    include: {
      student: { select: { fullName: true, email: true } },
      supervisor: { select: { fullName: true } },
    },
    orderBy: { startDate: "asc" },
  });
}

export async function getPlacement(user: CurrentUser | null, placementId: string) {
  const authedUser = await authorize(user, "placement:manage");

  const placement = await prisma.clinicalPlacement.findUnique({
    where: { id: placementId },
    include: {
      student: { select: { fullName: true, email: true } },
      department: { select: { id: true, name: true } },
      supervisor: { select: { fullName: true } },
    },
  });
  if (!placement) return null;

  const scopeId = scopeDepartmentId(authedUser);
  if (scopeId && placement.departmentId !== scopeId) {
    return null;
  }

  return placement;
}

// Lets a director "post a student to another department" or swap their
// supervisor - a director may only touch a placement whose CURRENT
// department is their own (Administrator is unrestricted), but may move it
// to any department, same as scopeDepartmentId enforces elsewhere in this
// file. Dates/status are untouched - this is a reassignment, not a new
// placement, so the overlap check createPlacement runs doesn't apply here.
export async function reassignPlacement(
  user: CurrentUser | null,
  placementId: string,
  input: { departmentId?: string; supervisorId?: string | null },
) {
  const authedUser = await authorize(user, "placement:manage");

  const existing = await prisma.clinicalPlacement.findUnique({
    where: { id: placementId },
  });
  if (!existing) {
    throw new Error("Placement not found");
  }

  const scopeId = scopeDepartmentId(authedUser);
  if (scopeId && existing.departmentId !== scopeId) {
    throw new AuthorizationError("You can only manage placements within your own department.");
  }

  let newDepartmentId = existing.departmentId;
  if (input.departmentId && input.departmentId !== existing.departmentId) {
    const department = await prisma.department.findUnique({
      where: { id: input.departmentId },
    });
    if (!department) {
      throw new Error("Selected department does not exist");
    }
    newDepartmentId = department.id;
  }

  let newSupervisorId = existing.supervisorId;
  if (input.supervisorId !== undefined) {
    if (input.supervisorId === null || input.supervisorId === "") {
      newSupervisorId = null;
    } else {
      const supervisor = await prisma.user.findFirst({
        where: { id: input.supervisorId, role: { name: { not: "STUDENT" } } },
      });
      if (!supervisor) {
        throw new Error("Selected supervisor does not exist");
      }
      newSupervisorId = supervisor.id;
    }
  }

  const placement = await prisma.clinicalPlacement.update({
    where: { id: placementId },
    data: { departmentId: newDepartmentId, supervisorId: newSupervisorId },
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: "PLACEMENT_REASSIGN",
    entityType: "ClinicalPlacement",
    entityId: placement.id,
    metadata: {
      fromDepartmentId: existing.departmentId,
      toDepartmentId: newDepartmentId,
      fromSupervisorId: existing.supervisorId,
      toSupervisorId: newSupervisorId,
    },
  });

  return placement;
}
