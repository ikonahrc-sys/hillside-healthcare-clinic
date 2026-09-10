"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export type LoginState = { error: string } | null;

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

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true, placementsAsStudent: true },
  });

  if (!user) return genericError;

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) return genericError;

  if (user.status !== "ACTIVE") {
    return { error: "This account is not active. Contact an administrator." };
  }

  if (user.role.name === "STUDENT") {
    const now = new Date();
    const hasActivePlacement = user.placementsAsStudent.some(
      (placement) =>
        (placement.status === "ACTIVE" || placement.status === "EXTENDED") &&
        placement.startDate <= now &&
        placement.endDate >= now,
    );
    if (!hasActivePlacement) {
      return {
        error:
          "No active clinical placement found. Access is only available during an active placement.",
      };
    }
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
