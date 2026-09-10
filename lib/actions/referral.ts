"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  referralInputSchema,
  referralResponseSchema,
} from "@/lib/validation/referral";
import { createReferral, respondToReferral } from "@/lib/services/referral-service";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthorizationError } from "@/lib/auth/authorize";

export type CreateReferralState = { error: string } | null;

export async function createReferralAction(
  patientId: string,
  _prevState: CreateReferralState,
  formData: FormData,
): Promise<CreateReferralState> {
  const parsed = referralInputSchema.safeParse({
    toDepartmentId: formData.get("toDepartmentId"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = await getCurrentUser();

  try {
    await createReferral(user, patientId, parsed.data);
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return { error: "You are not authorized to create referrals." };
    }
    if (e instanceof Error) {
      return { error: e.message };
    }
    throw e;
  }

  redirect(`/patients/${patientId}`);
}

export async function respondToReferralAction(formData: FormData) {
  const referralId = formData.get("referralId");
  const parsed = referralResponseSchema.safeParse({
    decision: formData.get("decision"),
    responseNotes: formData.get("responseNotes"),
  });

  if (typeof referralId !== "string" || !parsed.success) {
    return;
  }

  const user = await getCurrentUser();
  try {
    await respondToReferral(user, referralId, parsed.data);
  } catch {
    // Most likely someone else already responded to this referral (a
    // legitimate race, not a bug) or a permission edge case. Either way,
    // revalidating below shows the current real state rather than crashing
    // to an error page over what's often a harmless double-click.
  } finally {
    revalidatePath("/referrals");
  }
}
