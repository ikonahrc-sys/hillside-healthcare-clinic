"use server";

import { redirect } from "next/navigation";
import { createPlacementSchema } from "@/lib/validation/placement";
import { createPlacement } from "@/lib/services/placement-service";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthorizationError } from "@/lib/auth/authorize";

export type CreatePlacementState = { error: string } | null;

export async function createPlacementAction(
  _prevState: CreatePlacementState,
  formData: FormData,
): Promise<CreatePlacementState> {
  const parsed = createPlacementSchema.safeParse({
    studentId: formData.get("studentId"),
    departmentId: formData.get("departmentId"),
    supervisorId: formData.get("supervisorId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    clinicalArea: formData.get("clinicalArea"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = await getCurrentUser();

  try {
    await createPlacement(user, parsed.data);
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return { error: "You are not authorized to create placements." };
    }
    if (e instanceof Error) {
      return { error: e.message };
    }
    throw e;
  }

  redirect(`/placements`);
}
