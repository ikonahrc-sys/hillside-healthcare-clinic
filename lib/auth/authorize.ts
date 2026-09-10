import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import type { CurrentUser } from "@/lib/auth/session";

export class AuthorizationError extends Error {
  constructor(message = "Not authorized") {
    super(message);
    this.name = "AuthorizationError";
  }
}

// Cached per-request: the same role's permissions are looked up once even
// if authorize() is called many times while rendering a single page.
const getPermissionKeys = cache(async (roleId: string): Promise<Set<string>> => {
  const rolePermissions = await prisma.rolePermission.findMany({
    where: { roleId },
    select: { permission: { select: { key: true } } },
  });
  return new Set(rolePermissions.map((rp) => rp.permission.key));
});

export async function can(
  user: CurrentUser,
  permissionKey: string,
): Promise<boolean> {
  const keys = await getPermissionKeys(user.role.id);
  return keys.has(permissionKey);
}

/**
 * The single server-side gate. Call this at the top of every service
 * function - never trust a permission check that only exists in the UI.
 * Returns the user (for convenience) if allowed, throws otherwise.
 */
export async function authorize(
  user: CurrentUser | null,
  permissionKey: string,
): Promise<CurrentUser> {
  if (!user) {
    throw new AuthorizationError("Not signed in");
  }
  if (!(await can(user, permissionKey))) {
    throw new AuthorizationError(`Missing permission: ${permissionKey}`);
  }
  return user;
}
