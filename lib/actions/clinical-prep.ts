"use server";

import { redirect } from "next/navigation";
import { clinicalPreparationNoteSchema } from "@/lib/validation/clinical-prep";
import { createPreparationNote } from "@/lib/services/clinical-prep-service";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthorizationError } from "@/lib/auth/authorize";

export type ClinicalPrepActionState = { error: string } | null;

export async function createPreparationNoteAction(
  _prevState: ClinicalPrepActionState,
  formData: FormData,
): Promise<ClinicalPrepActionState> {
  const patientId = formData.get("patientId");
  if (typeof patientId !== "string" || !patientId) {
    return { error: "Please select a patient." };
  }

  const parsed = clinicalPreparationNoteSchema.safeParse({
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = await getCurrentUser();

  try {
    await createPreparationNote(user, patientId, parsed.data);
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return { error: "You are not authorized to create preparation notes." };
    }
    if (e instanceof Error) {
      return { error: e.message };
    }
    throw e;
  }

  redirect(`/clinical-preparation`);
}
