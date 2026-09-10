"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, getCurrentUser } from "@/lib/auth/session";
import { hasActivePlacement } from "@/lib/auth/placement";
import { logAudit } from "@/lib/audit/log";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export type LoginState = { error: string } | null;

// Reuses the audit log rather than adding lockout-tracking columns to
// User - every failed attempt is already recorded there with the
// attempted email, so counting recent ones is enough to throttle
// brute-forcing without any new schema.
const LOGIN_ATTEMPT_LIMIT = 5;
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const { email, password } = parsed.data;

  // Same error message for "no such user" and "wrong password" - being
  // specific here tells an attacker which emails are registered.
  const genericError: LoginState = { error: "Invalid email or password." };
  const rateLimitedError: LoginState = {
    error: "Too many failed attempts for this account. Please wait 15 minutes and try again.",
  };

  const recentFailures = await prisma.auditLog.count({
    where: {
      actorEmail: email,
      action: "LOGIN_FAILED",
      createdAt: { gte: new Date(Date.now() - LOGIN_ATTEMPT_WINDOW_MS) },
    },
  });
  if (recentFailures >= LOGIN_ATTEMPT_LIMIT) {
    return rateLimitedError;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true, placementsAsStudent: true },
  });

  if (!user) {
    await logAudit({
      actorEmail: email,
      action: "LOGIN_FAILED",
      metadata: { reason: "unknown_email" },
    });
    return genericError;
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) {
    await logAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: "LOGIN_FAILED",
      metadata: { reason: "wrong_password" },
    });
    return genericError;
  }

  if (user.status !== "ACTIVE") {
    await logAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: "LOGIN_FAILED",
      metadata: { reason: "inactive_account", status: user.status },
    });
    return { error: "This account is not active. Contact an administrator." };
  }

  if (
    user.role.name === "STUDENT" &&
    !hasActivePlacement(user.placementsAsStudent)
  ) {
    await logAudit({
      actorId: user.id,
      actorEmail: user.email,
      action: "LOGIN_FAILED",
      metadata: { reason: "no_active_placement" },
    });
    return {
      error:
        "No active clinical placement found. Access is only available during an active placement.",
    };
  }

  await createSession(user.id);
  await logAudit({ actorId: user.id, actorEmail: user.email, action: "LOGIN" });
  redirect("/dashboard");
}

export async function logoutAction() {
  const user = await getCurrentUser();
  await destroySession();
  if (user) {
    await logAudit({ actorId: user.id, actorEmail: user.email, action: "LOGOUT" });
  }
  redirect("/login");
}
