"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createUserSchema,
  changePasswordSchema,
  resetPasswordSchema,
} from "@/lib/validation/user";
import {
  createUser,
  setUserStatus,
  changeOwnPassword,
  resetUserPassword,
} from "@/lib/services/user-service";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthorizationError } from "@/lib/auth/authorize";

export type CreateUserState = { error: string } | null;

export async function createUserAction(
  _prevState: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  const parsed = createUserSchema.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    password: formData.get("password"),
    roleId: formData.get("roleId"),
    departmentId: formData.get("departmentId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = await getCurrentUser();

  try {
    await createUser(user, parsed.data);
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return { error: "You are not authorized to create users." };
    }
    if (e instanceof Error) {
      return { error: e.message };
    }
    throw e;
  }

  redirect("/users");
}

export async function setUserStatusAction(formData: FormData) {
  const userId = formData.get("userId");
  const status = formData.get("status");
  if (typeof userId !== "string" || (status !== "ACTIVE" && status !== "INACTIVE")) {
    return;
  }

  const user = await getCurrentUser();
  try {
    await setUserStatus(user, userId, status);
  } catch {
    // Most likely a permission edge case or the self-deactivation guard -
    // revalidating below shows the current real state rather than
    // crashing to an error page.
  } finally {
    revalidatePath("/users");
  }
}

export type ChangePasswordState = { error: string } | { success: true } | null;

export async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = await getCurrentUser();

  try {
    await changeOwnPassword(user, parsed.data.currentPassword, parsed.data.newPassword);
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return { error: "You must be signed in to change your password." };
    }
    if (e instanceof Error) {
      return { error: e.message };
    }
    throw e;
  }

  return { success: true };
}

export type ResetPasswordState = { error: string } | null;

export async function resetUserPasswordAction(
  targetUserId: string,
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = resetPasswordSchema.safeParse({
    newPassword: formData.get("newPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = await getCurrentUser();

  try {
    await resetUserPassword(user, targetUserId, parsed.data.newPassword);
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return { error: "You are not authorized to reset passwords." };
    }
    if (e instanceof Error) {
      return { error: e.message };
    }
    throw e;
  }

  redirect("/users");
}
