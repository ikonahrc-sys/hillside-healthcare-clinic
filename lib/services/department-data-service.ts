import "server-only";
import { prisma } from "@/lib/db";
import { authorize } from "@/lib/auth/authorize";
import type { CurrentUser } from "@/lib/auth/session";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const EXPIRING_SOON_DAYS = 30;

// Facility-wide overview across every department - Administrator + every
// Director/Head (placement:manage, same audience as Reports/Placements).
// Deliberately separate from inventory-service.ts's listMedicinesWithStock:
// that's gated by inventory:manage, which most directors don't hold and
// shouldn't gain just to see an aggregate count on this page.
export async function getDepartmentData(user: CurrentUser | null) {
  await authorize(user, "placement:manage");

  const now = new Date();
  const weekAgo = new Date(now.getTime() - WEEK_MS);
  const expiringSoonCutoff = new Date(now.getTime() + EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000);

  const [
    departments,
    referralsByDepartment,
    consultationsTotal,
    consultationsWeek,
    activeTreatmentPlans,
    therapySessionsWeek,
    activeCarePlans,
    homeVisitsWeek,
    prescriptionsPending,
    dispensedWeek,
    medicines,
    outreachVisitsTotal,
    outreachVisitsWeek,
    peopleReachedAgg,
    surveillanceByStatus,
  ] = await Promise.all([
    prisma.department.findMany({ select: { id: true, name: true, code: true } }),
    prisma.referral.groupBy({ by: ["toDepartmentId"], _count: { _all: true } }),
    prisma.consultation.count({ where: { deletedAt: null } }),
    prisma.consultation.count({
      where: { deletedAt: null, consultationDate: { gte: weekAgo } },
    }),
    prisma.rehabTreatmentPlan.count({ where: { status: "ACTIVE" } }),
    prisma.therapySession.count({ where: { sessionDate: { gte: weekAgo } } }),
    prisma.homeNursingCarePlan.count({ where: { status: "ACTIVE" } }),
    prisma.homeVisit.count({ where: { visitDate: { gte: weekAgo } } }),
    prisma.prescription.count({ where: { status: { in: ["PENDING", "PROCESSING"] } } }),
    prisma.inventoryTransaction.count({
      where: { type: "DISPENSED", createdAt: { gte: weekAgo } },
    }),
    prisma.medicine.findMany({ select: { reorderLevel: true, batches: { select: { quantityOnHand: true, expiryDate: true } } } }),
    prisma.communityOutreachVisit.count(),
    prisma.communityOutreachVisit.count({ where: { visitDate: { gte: weekAgo } } }),
    prisma.communityOutreachVisit.aggregate({ _sum: { peopleReached: true } }),
    prisma.diseaseSurveillanceCase.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const referralCountByDeptId = new Map(
    referralsByDepartment.map((r) => [r.toDepartmentId, r._count._all]),
  );

  const lowStockCount = medicines.filter((m) => {
    if (m.reorderLevel == null) return false;
    const onHand = m.batches
      .filter((b) => b.expiryDate > now)
      .reduce((sum, b) => sum + b.quantityOnHand, 0);
    return onHand < m.reorderLevel;
  }).length;

  const expiringSoonCount = medicines.reduce(
    (count, m) =>
      count +
      m.batches.filter((b) => b.expiryDate > now && b.expiryDate <= expiringSoonCutoff).length,
    0,
  );

  return {
    referralsByDepartment: departments.map((d) => ({
      label: d.name,
      value: referralCountByDeptId.get(d.id) ?? 0,
    })),
    medical: { consultationsTotal, consultationsWeek },
    rehab: { activeTreatmentPlans, therapySessionsWeek },
    homeNursing: { activeCarePlans, homeVisitsWeek },
    pharmacy: { prescriptionsPending, dispensedWeek, lowStockCount, expiringSoonCount },
    publicHealth: {
      outreachVisitsTotal,
      outreachVisitsWeek,
      peopleReachedTotal: peopleReachedAgg._sum.peopleReached ?? 0,
      surveillanceByStatus: surveillanceByStatus.map((s) => ({
        label: s.status,
        value: s._count._all,
      })),
    },
  };
}
