import type { listConsultationsForPatient } from "@/lib/services/consultation-service";
import type { listPrescriptionsForPatient } from "@/lib/services/prescription-service";
import type { listReferralsForPatient } from "@/lib/services/referral-service";
import type { listAppointmentsForPatient } from "@/lib/services/appointment-service";
import type { listRehabAssessmentsForPatient } from "@/lib/services/rehab-service";

type Consultation = Awaited<ReturnType<typeof listConsultationsForPatient>>[number];
type Prescription = Awaited<ReturnType<typeof listPrescriptionsForPatient>>[number];
type Referral = Awaited<ReturnType<typeof listReferralsForPatient>>[number];
type Appointment = Awaited<ReturnType<typeof listAppointmentsForPatient>>[number];
type RehabAssessment = Awaited<ReturnType<typeof listRehabAssessmentsForPatient>>[number];

const DISCIPLINE_LABELS: Record<string, string> = {
  PHYSIOTHERAPY: "Physiotherapy",
  SPEECH_THERAPY: "Speech Therapy",
  OCCUPATIONAL_THERAPY: "Occupational Therapy",
};

export type TimelineEntry = {
  id: string;
  date: Date;
  type: "consultation" | "prescription" | "referral" | "appointment" | "rehab";
  title: string;
  subtitle: string;
  isUpcoming: boolean;
};

export function buildPatientTimeline(data: {
  consultations: Consultation[];
  prescriptions: Prescription[];
  referrals: Referral[];
  appointments: Appointment[];
  rehabAssessments: RehabAssessment[];
}): TimelineEntry[] {
  const now = new Date();
  const entries: TimelineEntry[] = [];

  for (const c of data.consultations) {
    entries.push({
      id: c.id,
      date: c.consultationDate,
      type: "consultation",
      title: c.chiefComplaint,
      subtitle: `Consultation - ${c.doctor.fullName}`,
      isUpcoming: c.consultationDate > now,
    });
  }

  for (const p of data.prescriptions) {
    entries.push({
      id: p.id,
      date: p.createdAt,
      type: "prescription",
      title: p.items.map((i) => i.medicine.name).join(", ") || "Prescription",
      subtitle: `Prescription (${p.status}) - ${p.prescribedByUser.fullName}`,
      isUpcoming: false,
    });
  }

  for (const r of data.referrals) {
    entries.push({
      id: r.id,
      date: r.createdAt,
      type: "referral",
      title: `${r.fromDepartment.name} -> ${r.toDepartment.name}`,
      subtitle: `Referral (${r.status}) - ${r.referringUser.fullName}`,
      isUpcoming: false,
    });
  }

  for (const a of data.appointments) {
    entries.push({
      id: a.id,
      date: a.scheduledAt,
      type: "appointment",
      title: "Medical follow-up",
      subtitle: `Appointment (${a.status}) - ${a.staff.fullName}`,
      isUpcoming: a.scheduledAt > now,
    });
  }

  for (const ra of data.rehabAssessments) {
    entries.push({
      id: ra.id,
      date: ra.createdAt,
      type: "rehab",
      title: `${DISCIPLINE_LABELS[ra.discipline]} assessment`,
      subtitle: `Rehabilitation - ${ra.therapist.fullName}${ra.treatmentPlan ? " (plan active)" : ""}`,
      isUpcoming: false,
    });
  }

  return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
}
