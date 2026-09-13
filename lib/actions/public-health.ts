"use server";

import { redirect } from "next/navigation";
import {
  outreachVisitSchema,
  surveillanceCaseSchema,
} from "@/lib/validation/public-health";
import {
  createOutreachVisit,
  createSurveillanceCase,
} from "@/lib/services/public-health-service";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthorizationError } from "@/lib/auth/authorize";

export type OutreachVisitState = { error: string } | null;

export async function createOutreachVisitAction(
  _prevState: OutreachVisitState,
  formData: FormData,
): Promise<OutreachVisitState> {
  const parsed = outreachVisitSchema.safeParse({
    visitDate: formData.get("visitDate"),
    location: formData.get("location"),
    activity: formData.get("activity"),
    peopleReached: formData.get("peopleReached"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = await getCurrentUser();

  try {
    await createOutreachVisit(user, parsed.data);
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return { error: "You are not authorized to log outreach visits." };
    }
    if (e instanceof Error) {
      return { error: e.message };
    }
    throw e;
  }

  redirect("/public-health");
}

export type SurveillanceCaseState = { error: string } | null;

export async function createSurveillanceCaseAction(
  _prevState: SurveillanceCaseState,
  formData: FormData,
): Promise<SurveillanceCaseState> {
  const parsed = surveillanceCaseSchema.safeParse({
    diseaseName: formData.get("diseaseName"),
    reportDate: formData.get("reportDate"),
    location: formData.get("location"),
    status: formData.get("status"),
    patientId: formData.get("patientId"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = await getCurrentUser();

  try {
    await createSurveillanceCase(user, parsed.data);
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return { error: "You are not authorized to log surveillance cases." };
    }
    if (e instanceof Error) {
      return { error: e.message };
    }
    throw e;
  }

  redirect("/public-health");
}
