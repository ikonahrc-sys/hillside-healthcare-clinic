"use server";

import { redirect } from "next/navigation";
import { prescriptionInputSchema } from "@/lib/validation/prescription";
import { createPrescription } from "@/lib/services/prescription-service";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthorizationError } from "@/lib/auth/authorize";

export type CreatePrescriptionState = { error: string } | null;

export async function createPrescriptionAction(
  patientId: string,
  _prevState: CreatePrescriptionState,
  formData: FormData,
): Promise<CreatePrescriptionState> {
  const parsed = prescriptionInputSchema.safeParse({
    notes: formData.get("notes"),
    itemsJson: formData.get("itemsJson"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = await getCurrentUser();

  try {
    await createPrescription(user, patientId, parsed.data);
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return { error: "You are not authorized to write prescriptions." };
    }
    if (e instanceof Error) {
      return { error: e.message };
    }
    throw e;
  }

  redirect(`/patients/${patientId}`);
}
