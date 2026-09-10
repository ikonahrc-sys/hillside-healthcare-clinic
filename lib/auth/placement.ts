import "server-only";
import { prisma } from "@/lib/db";
import type { ClinicalPlacement } from "@/app/generated/prisma/client";

/**
 * The single source of truth for "is this student currently allowed in" -
 * a live date-range check, not a stored status flag. There is no background
 * job in this project that transitions UPCOMING -> ACTIVE as a start date
 * arrives (or ACTIVE -> EXPIRED as an end date passes), so requiring
 * status === "ACTIVE" here would permanently lock out a student whose
 * placement was created ahead of time. SUSPENDED is the one status that
 * should still override the date window - an explicit admin action, not a
 * timing state - everything else (UPCOMING/ACTIVE/EXTENDED/EXPIRED) is
 * purely a display label derived from the same dates this function reads.
 */
export function hasActivePlacement(placements: ClinicalPlacement[]): boolean {
  const now = new Date();
  return placements.some(
    (placement) =>
      placement.status !== "SUSPENDED" &&
      placement.startDate <= now &&
      placement.endDate >= now,
  );
}

/** Same access rule as hasActivePlacement, but returns the matching
 * placement itself - callers need its departmentId to scope what the
 * student can see. */
export function getActivePlacement(
  placements: ClinicalPlacement[],
): ClinicalPlacement | undefined {
  const now = new Date();
  return placements.find(
    (placement) =>
      placement.status !== "SUSPENDED" &&
      placement.startDate <= now &&
      placement.endDate >= now,
  );
}

/** The department of a student's currently active placement, if any -
 * shared by both "which patients does this student see" (patient-service)
 * and "can this student author records in this department" (clinical-author). */
export async function getActivePlacementDepartment(userId: string) {
  const placements = await prisma.clinicalPlacement.findMany({
    where: { studentId: userId },
    include: { department: { select: { id: true, name: true, code: true } } },
  });
  const active = getActivePlacement(placements);
  return active ? placements.find((p) => p.id === active.id)?.department : undefined;
}
