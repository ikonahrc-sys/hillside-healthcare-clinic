"use server";

import { redirect } from "next/navigation";
import { createPlacementSchema, reassignPlacementSchema } from "@/lib/validation/placement";
import { createPlacement, reassignPlacement } from "@/lib/services/placement-service";
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

export type ReassignPlacementState = { error: string } | null;

export async function reassignPlacementAction(
  placementId: string,
  _prevState: ReassignPlacementState,
  formData: FormData,
): Promise<ReassignPlacementState> {
  const parsed = reassignPlacementSchema.safeParse({
    departmentId: formData.get("departmentId"),
    supervisorId: formData.get("supervisorId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = await getCurrentUser();

  try {
    await reassignPlacement(user, placementId, parsed.data);
  } catch (e) {
    if (e instanceof Error) {
      return { error: e.message };
    }
    throw e;
  }

  redirect(`/placements`);
}
