import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const SESSION_COOKIE_NAME = "hillside_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export async function createSession(userId: string) {
  const session = await prisma.session.create({
    data: {
      userId,
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: session.expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (sessionId) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {
      // Already gone - nothing to do.
    });
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  role: { id: string; name: string };
  departmentId: string | null;
};

/**
 * Re-derives the current user from the database on every call - including
 * the student placement check - rather than trusting anything cached in the
 * session cookie itself. `cache()` only dedupes repeat calls within a single
 * request; it never carries a result across requests.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        include: {
          role: true,
          placementsAsStudent: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  const { user } = session;

  if (user.status !== "ACTIVE") {
    return null;
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
      return null;
    }
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: { id: user.role.id, name: user.role.name },
    departmentId: user.departmentId,
  };
});
