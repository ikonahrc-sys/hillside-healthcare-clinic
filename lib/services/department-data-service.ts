import "server-only";
import { prisma } from "@/lib/db";
import { requireAuthenticated } from "@/lib/auth/authorize";
import type { CurrentUser } from "@/lib/auth/session";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const EXPIRING_SOON_DAYS = 30;

// Every signed-in user sees their own department's numbers -
// Administrator (the one role with no single caseload of its own) is the
// only one who sees every department at once. Deliberately a separate
// query path from inventory-service.ts's listMedicinesWithStock (which is
// gated by inventory:manage): most staff/Directors don't hold
// inventory:manage and shouldn't gain it just to see an aggregate count
// on this page.
export async function getDepartmentData(user: CurrentUser | null) {
  const authedUser = requireAuthenticated(user);
  const isAdmin = authedUser.role.name === "ADMINISTRATOR";

  const now = new Date();
  const weekAgo = new Date(now.getTime() - WEEK_MS);
  const expiringSoonCutoff = new Date(now.getTime() + EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000);

  const [
    departments,
    referralsByDepartment,
    consultationsTotal,
    consultationsWeek,
    activeTreatmentPlans,
    newCasesWeek,
    continuingWeek,
    homeHealthVisitsWeek,
    mobileClinicVisitsWeek,
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
    prisma.rehabAssessment.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.therapySession.count({ where: { sessionDate: { gte: weekAgo } } }),
    prisma.therapySession.count({
      where: { sessionDate: { gte: weekAgo }, setting: "HOME_HEALTH_VISIT" },
    }),
    prisma.therapySession.count({
      where: { sessionDate: { gte: weekAgo }, setting: "MOBILE_CLINIC" },
    }),
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

  const medical = { consultationsTotal, consultationsWeek };
  const rehab = {
    activeTreatmentPlans,
    newCasesWeek,
    continuingWeek,
    homeHealthVisitsWeek,
    mobileClinicVisitsWeek,
  };
  const homeNursing = { activeCarePlans, homeVisitsWeek };
  const pharmacy = { prescriptionsPending, dispensedWeek, lowStockCount, expiringSoonCount };
  const publicHealth = {
    outreachVisitsTotal,
    outreachVisitsWeek,
    peopleReachedTotal: peopleReachedAgg._sum.peopleReached ?? 0,
    surveillanceByStatus: surveillanceByStatus.map((s) => ({
      label: s.status,
      value: s._count._all,
    })),
  };

  const sectionsByCode: Record<
    string,
    {
      medical?: typeof medical;
      rehab?: typeof rehab;
      homeNursing?: typeof homeNursing;
      pharmacy?: typeof pharmacy;
      publicHealth?: typeof publicHealth;
    }
  > = {
    MED: { medical },
    REHAB: { rehab },
    HN: { homeNursing },
    PHARM: { pharmacy },
    PH: { publicHealth },
  };

  const referralsByDepartmentChart = departments.map((d) => ({
    label: d.name,
    value: referralCountByDeptId.get(d.id) ?? 0,
  }));

  if (isAdmin) {
    return {
      scope: "facility" as const,
      referralsByDepartment: referralsByDepartmentChart,
      medical,
      rehab,
      homeNursing,
      pharmacy,
      publicHealth,
    };
  }

  const department = departments.find((d) => d.id === authedUser.departmentId);
  const departmentSection = department ? sectionsByCode[department.code] : undefined;

  if (!department || !departmentSection) {
    return {
      scope: "none" as const,
      medical: undefined,
      rehab: undefined,
      homeNursing: undefined,
      pharmacy: undefined,
      publicHealth: undefined,
    };
  }

  return {
    scope: "department" as const,
    departmentName: department.name,
    referralsReceived: referralCountByDeptId.get(department.id) ?? 0,
    medical: departmentSection.medical,
    rehab: departmentSection.rehab,
    homeNursing: departmentSection.homeNursing,
    pharmacy: departmentSection.pharmacy,
    publicHealth: departmentSection.publicHealth,
  };
}
