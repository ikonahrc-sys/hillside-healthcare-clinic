import "server-only";
import { can, AuthorizationError } from "@/lib/auth/authorize";
import { getActivePlacementDepartment } from "@/lib/auth/placement";
import type { CurrentUser } from "@/lib/auth/session";

/**
 * Gate for creating a clinical record that a student may co-author. A
 * normal permission holder (e.g. rehab:manage) authors outright - no
 * co-sign needed. A STUDENT with a currently active placement in the
 * matching department may also author, but the resulting record must be
 * flagged pending co-sign by the caller until a normal permission holder
 * reviews it. Only ever use this in place of authorize() on the create
 * path of a record type that actually has coSignedByUserId/coSignedAt
 * fields - every other read/list/update path still uses plain authorize().
 */
export async function authorizeClinicalAuthor(
  user: CurrentUser | null,
  permissionKey: string,
  departmentCode: string,
): Promise<{ authedUser: CurrentUser; requiresCoSign: boolean }> {
  if (!user) {
    throw new AuthorizationError("Not signed in");
  }

  if (await can(user, permissionKey)) {
    return { authedUser: user, requiresCoSign: false };
  }

  if (user.role.name === "STUDENT") {
    const department = await getActivePlacementDepartment(user.id);
    if (department?.code === departmentCode) {
      return { authedUser: user, requiresCoSign: true };
    }
  }

  throw new AuthorizationError(`Missing permission: ${permissionKey}`);
}

/** Non-throwing form of authorizeClinicalAuthor's check, for page-level
 * "should this UI even render" gating rather than the create action itself. */
export async function canAuthorClinicalRecord(
  user: CurrentUser | null,
  permissionKey: string,
  departmentCode: string,
): Promise<boolean> {
  try {
    await authorizeClinicalAuthor(user, permissionKey, departmentCode);
    return true;
  } catch {
    return false;
  }
}
