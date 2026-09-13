"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createUserSchema } from "@/lib/validation/user";
import { createUser, setUserStatus } from "@/lib/services/user-service";
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
