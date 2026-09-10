"use server";

import { redirect } from "next/navigation";
import { patientInputSchema } from "@/lib/validation/patient";
import { createPatient } from "@/lib/services/patient-service";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthorizationError } from "@/lib/auth/authorize";

export type CreatePatientState = { error: string } | null;

export async function createPatientAction(
  _prevState: CreatePatientState,
  formData: FormData,
): Promise<CreatePatientState> {
  const parsed = patientInputSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    dateOfBirth: formData.get("dateOfBirth"),
    sex: formData.get("sex"),
    address: formData.get("address"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    emergencyContactName: formData.get("emergencyContactName"),
    emergencyContactPhone: formData.get("emergencyContactPhone"),
    allergies: formData.get("allergies"),
    medicalHistoryNotes: formData.get("medicalHistoryNotes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = await getCurrentUser();

  let patientId: string;
  try {
    const patient = await createPatient(user, parsed.data);
    patientId = patient.id;
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return { error: "You are not authorized to register patients." };
    }
    throw e;
  }

  redirect(`/patients/${patientId}`);
}
