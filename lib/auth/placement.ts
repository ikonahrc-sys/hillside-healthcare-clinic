import type { ClinicalPlacement } from "@/app/generated/prisma/client";

/**
 * The single source of truth for "is this student currently allowed in."
 * A live date-range check, not just a status flag - the status field is
 * maintained by a daily reconciliation job for display purposes only and
 * must never be trusted on its own for access control.
 */
export function hasActivePlacement(placements: ClinicalPlacement[]): boolean {
  const now = new Date();
  return placements.some(
    (placement) =>
      (placement.status === "ACTIVE" || placement.status === "EXTENDED") &&
      placement.startDate <= now &&
      placement.endDate >= now,
  );
}
