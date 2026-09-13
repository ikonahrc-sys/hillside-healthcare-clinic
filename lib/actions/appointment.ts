"use server";

import { redirect } from "next/navigation";
import { scheduleAppointmentSchema } from "@/lib/validation/appointment";
import { scheduleAppointment } from "@/lib/services/appointment-service";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthorizationError } from "@/lib/auth/authorize";

export type ScheduleAppointmentState = { error: string } | null;

// One shared action behind the one central booking form - every
// department schedules through this, not a per-department action.
export async function scheduleAppointmentAction(
  patientId: string,
  _prevState: ScheduleAppointmentState,
  formData: FormData,
): Promise<ScheduleAppointmentState> {
  const parsed = scheduleAppointmentSchema.safeParse({
    type: formData.get("type"),
    scheduledAt: formData.get("scheduledAt"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = await getCurrentUser();

  try {
    await scheduleAppointment(user, patientId, parsed.data);
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return { error: "You are not authorized to schedule appointments." };
    }
    if (e instanceof Error) {
      return { error: e.message };
    }
    throw e;
  }

  redirect(`/patients/${patientId}`);
}
