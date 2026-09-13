import "server-only";
import { prisma } from "@/lib/db";
import { authorize, requireAuthenticated } from "@/lib/auth/authorize";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { logAudit } from "@/lib/audit/log";
import type { CurrentUser } from "@/lib/auth/session";
import type { CreateUserInput } from "@/lib/validation/user";

export async function listUsers(user: CurrentUser | null) {
  await authorize(user, "user:manage");

  return prisma.user.findMany({
    select: {
      id: true,
      fullName: true,
      email: true,
      status: true,
      role: { select: { name: true } },
      department: { select: { name: true } },
    },
    orderBy: { fullName: "asc" },
  });
}

export async function listRoles(user: CurrentUser | null) {
  await authorize(user, "user:manage");

  return prisma.role.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function createUser(
  user: CurrentUser | null,
  input: CreateUserInput,
) {
  const authedUser = await authorize(user, "user:manage");

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    throw new Error("A user with this email already exists.");
  }

  const role = await prisma.role.findUnique({ where: { id: input.roleId } });
  if (!role) {
    throw new Error("Selected role does not exist");
  }

  if (input.departmentId) {
    const department = await prisma.department.findUnique({
      where: { id: input.departmentId },
    });
    if (!department) {
      throw new Error("Selected department does not exist");
    }
  }

  const passwordHash = await hashPassword(input.password);

  const newUser = await prisma.user.create({
    data: {
      email: input.email,
      fullName: input.fullName,
      passwordHash,
      roleId: input.roleId,
      departmentId: input.departmentId,
    },
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: "USER_CREATE",
    entityType: "User",
    entityId: newUser.id,
    metadata: { email: newUser.email, roleId: input.roleId, departmentId: input.departmentId },
  });

  return newUser;
}

export async function setUserStatus(
  user: CurrentUser | null,
  targetUserId: string,
  status: "ACTIVE" | "INACTIVE",
) {
  const authedUser = await authorize(user, "user:manage");

  if (targetUserId === authedUser.id) {
    throw new Error("You cannot change your own account's status.");
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) {
    throw new Error("User not found");
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: { status },
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: status === "ACTIVE" ? "USER_ACTIVATE" : "USER_DEACTIVATE",
    entityType: "User",
    entityId: targetUserId,
  });
}

// For when someone forgets their password - there is no reset-by-email
// flow, so this is the only recovery path. Unlike changeOwnPassword, this
// does not require the current password (the admin doesn't know it, and
// that's the whole point) - user:manage is the authority being trusted
// here instead.
export async function resetUserPassword(
  user: CurrentUser | null,
  targetUserId: string,
  newPassword: string,
) {
  const authedUser = await authorize(user, "user:manage");

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) {
    throw new Error("User not found");
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: targetUserId },
    data: { passwordHash },
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: "USER_PASSWORD_RESET",
    entityType: "User",
    entityId: targetUserId,
  });
}

// Anyone signed in can change their own password - no user:manage needed,
// since this only ever touches the caller's own row. Requiring the current
// password (not just an active session) guards against a walked-away-from
// session being used to lock the real owner out permanently.
export async function changeOwnPassword(
  user: CurrentUser | null,
  currentPassword: string,
  newPassword: string,
) {
  const authedUser = requireAuthenticated(user);

  const dbUser = await prisma.user.findUnique({ where: { id: authedUser.id } });
  if (!dbUser) {
    throw new Error("User not found");
  }

  const matches = await verifyPassword(currentPassword, dbUser.passwordHash);
  if (!matches) {
    throw new Error("Current password is incorrect.");
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: authedUser.id },
    data: { passwordHash },
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: "PASSWORD_CHANGE",
  });
}
