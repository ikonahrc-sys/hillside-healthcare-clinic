import "server-only";
import { prisma } from "@/lib/db";
import { authorize } from "@/lib/auth/authorize";
import type { CurrentUser } from "@/lib/auth/session";

const DISCIPLINE_LABELS: Record<string, string> = {
  PHYSIOTHERAPY: "Physiotherapy",
  SPEECH_THERAPY: "Speech Therapy",
  OCCUPATIONAL_THERAPY: "Occupational Therapy",
};

export type PendingCoSign = {
  id: string;
  label: string;
  department: string;
  studentName: string;
  patientName: string;
  patientMrn: number;
  date: Date;
  detailHref: string;
};

// A facility-wide view of every student-authored record still awaiting a
// co-sign, across every department that has the workflow wired up so
// far. Each of the six record types (see Phase 6 steps 2-4) shares the
// same "pending" rule - author's role is STUDENT and coSignedAt is null
// - so this just re-applies that rule at the query level instead of
// per-record, and merges the results into one list for oversight.
// Zero new schema: everything here already exists.
export async function listPendingCoSigns(
  user: CurrentUser | null,
): Promise<PendingCoSign[]> {
  await authorize(user, "placement:manage");

  const patientSelect = {
    select: { firstName: true, lastName: true, mrnNumber: true },
  } as const;
  const studentFilter = { therapist: { role: { name: "STUDENT" as const } } };
  const nurseStudentFilter = { nurse: { role: { name: "STUDENT" as const } } };

  const [
    rehabAssessments,
    treatmentPlans,
    therapySessions,
    hnAssessments,
    carePlans,
    homeVisits,
  ] = await Promise.all([
    prisma.rehabAssessment.findMany({
      where: { coSignedAt: null, ...studentFilter },
      include: { therapist: { select: { fullName: true } }, patient: patientSelect },
    }),
    prisma.rehabTreatmentPlan.findMany({
      where: { coSignedAt: null, ...studentFilter },
      include: { therapist: { select: { fullName: true } }, patient: patientSelect },
    }),
    prisma.therapySession.findMany({
      where: { coSignedAt: null, ...studentFilter },
      include: {
        therapist: { select: { fullName: true } },
        patient: patientSelect,
        treatmentPlan: { select: { assessmentId: true } },
      },
    }),
    prisma.homeNursingAssessment.findMany({
      where: { coSignedAt: null, ...nurseStudentFilter },
      include: { nurse: { select: { fullName: true } }, patient: patientSelect },
    }),
    prisma.homeNursingCarePlan.findMany({
      where: { coSignedAt: null, ...nurseStudentFilter },
      include: { nurse: { select: { fullName: true } }, patient: patientSelect },
    }),
    prisma.homeVisit.findMany({
      where: { coSignedAt: null, ...nurseStudentFilter },
      include: {
        nurse: { select: { fullName: true } },
        patient: patientSelect,
        carePlan: { select: { assessmentId: true } },
      },
    }),
  ]);

  const items: PendingCoSign[] = [
    ...rehabAssessments.map((a) => ({
      id: a.id,
      label: `${DISCIPLINE_LABELS[a.discipline]} Assessment`,
      department: "Rehabilitation",
      studentName: a.therapist.fullName,
      patientName: `${a.patient.lastName}, ${a.patient.firstName}`,
      patientMrn: a.patient.mrnNumber,
      date: a.createdAt,
      detailHref: `/rehab-assessments/${a.id}`,
    })),
    ...treatmentPlans.map((p) => ({
      id: p.id,
      label: "Rehab Treatment Plan",
      department: "Rehabilitation",
      studentName: p.therapist.fullName,
      patientName: `${p.patient.lastName}, ${p.patient.firstName}`,
      patientMrn: p.patient.mrnNumber,
      date: p.createdAt,
      detailHref: `/rehab-assessments/${p.assessmentId}`,
    })),
    ...therapySessions.map((s) => ({
      id: s.id,
      label: "Therapy Session",
      department: "Rehabilitation",
      studentName: s.therapist.fullName,
      patientName: `${s.patient.lastName}, ${s.patient.firstName}`,
      patientMrn: s.patient.mrnNumber,
      date: s.sessionDate,
      detailHref: `/rehab-assessments/${s.treatmentPlan.assessmentId}`,
    })),
    ...hnAssessments.map((a) => ({
      id: a.id,
      label: "Home Nursing Assessment",
      department: "Home Nursing",
      studentName: a.nurse.fullName,
      patientName: `${a.patient.lastName}, ${a.patient.firstName}`,
      patientMrn: a.patient.mrnNumber,
      date: a.createdAt,
      detailHref: `/home-nursing-assessments/${a.id}`,
    })),
    ...carePlans.map((p) => ({
      id: p.id,
      label: "Home Nursing Care Plan",
      department: "Home Nursing",
      studentName: p.nurse.fullName,
      patientName: `${p.patient.lastName}, ${p.patient.firstName}`,
      patientMrn: p.patient.mrnNumber,
      date: p.createdAt,
      detailHref: `/home-nursing-assessments/${p.assessmentId}`,
    })),
    ...homeVisits.map((v) => ({
      id: v.id,
      label: "Home Visit",
      department: "Home Nursing",
      studentName: v.nurse.fullName,
      patientName: `${v.patient.lastName}, ${v.patient.firstName}`,
      patientMrn: v.patient.mrnNumber,
      date: v.visitDate,
      detailHref: `/home-nursing-assessments/${v.carePlan.assessmentId}`,
    })),
  ];

  return items.sort((a, b) => a.date.getTime() - b.date.getTime());
}
