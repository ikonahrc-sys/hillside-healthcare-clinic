"use server";

import { redirect } from "next/navigation";
import { scheduleAppointmentSchema } from "@/lib/validation/appointment";
import {
  scheduleFollowUp,
  scheduleTherapyAppointment,
  scheduleHomeNursingVisit,
} from "@/lib/services/appointment-service";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthorizationError } from "@/lib/auth/authorize";

export type ScheduleFollowUpState = { error: string } | null;

export async function scheduleFollowUpAction(
  patientId: string,
  _prevState: ScheduleFollowUpState,
  formData: FormData,
): Promise<ScheduleFollowUpState> {
  const parsed = scheduleAppointmentSchema.safeParse({
    scheduledAt: formData.get("scheduledAt"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = await getCurrentUser();

  try {
    await scheduleFollowUp(user, patientId, parsed.data);
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

export type ScheduleTherapyAppointmentState = { error: string } | null;

export async function scheduleTherapyAppointmentAction(
  patientId: string,
  _prevState: ScheduleTherapyAppointmentState,
  formData: FormData,
): Promise<ScheduleTherapyAppointmentState> {
  const parsed = scheduleAppointmentSchema.safeParse({
    scheduledAt: formData.get("scheduledAt"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = await getCurrentUser();

  try {
    await scheduleTherapyAppointment(user, patientId, parsed.data);
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return { error: "You are not authorized to schedule appointments." };
    }
    if (e instanceof Error) {
      return { error: e.message };
    }
    throw e;
  }

  redirect(`/patients/${patientId}?tab=rehabilitation`);
}

export type ScheduleHomeNursingVisitState = { error: string } | null;

export async function scheduleHomeNursingVisitAction(
  patientId: string,
  _prevState: ScheduleHomeNursingVisitState,
  formData: FormData,
): Promise<ScheduleHomeNursingVisitState> {
  const parsed = scheduleAppointmentSchema.safeParse({
    scheduledAt: formData.get("scheduledAt"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = await getCurrentUser();

  try {
    await scheduleHomeNursingVisit(user, patientId, parsed.data);
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return { error: "You are not authorized to schedule appointments." };
    }
    if (e instanceof Error) {
      return { error: e.message };
    }
    throw e;
  }

  redirect(`/patients/${patientId}?tab=home-nursing`);
}
