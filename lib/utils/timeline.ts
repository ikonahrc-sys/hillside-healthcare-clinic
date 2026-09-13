import type { listConsultationsForPatient } from "@/lib/services/consultation-service";
import type { listPrescriptionsForPatient } from "@/lib/services/prescription-service";
import type { listReferralsForPatient } from "@/lib/services/referral-service";
import type { listAppointmentsForPatient } from "@/lib/services/appointment-service";
import type {
  listRehabAssessmentsForPatient,
  listTherapySessionsForPatient,
} from "@/lib/services/rehab-service";
import type {
  listHomeNursingAssessmentsForPatient,
  listHomeVisitsForPatient,
} from "@/lib/services/home-nursing-service";

type Consultation = Awaited<ReturnType<typeof listConsultationsForPatient>>[number];
type Prescription = Awaited<ReturnType<typeof listPrescriptionsForPatient>>[number];
type Referral = Awaited<ReturnType<typeof listReferralsForPatient>>[number];
type Appointment = Awaited<ReturnType<typeof listAppointmentsForPatient>>[number];
type RehabAssessment = Awaited<ReturnType<typeof listRehabAssessmentsForPatient>>[number];
type TherapySession = Awaited<ReturnType<typeof listTherapySessionsForPatient>>[number];
type HomeNursingAssessment = Awaited<ReturnType<typeof listHomeNursingAssessmentsForPatient>>[number];
type HomeVisit = Awaited<ReturnType<typeof listHomeVisitsForPatient>>[number];

const DISCIPLINE_LABELS: Record<string, string> = {
  PHYSIOTHERAPY: "Physiotherapy",
  SPEECH_THERAPY: "Speech Therapy",
  OCCUPATIONAL_THERAPY: "Occupational Therapy",
};

const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  MEDICAL_FOLLOW_UP: "Medical follow-up",
  PHYSIOTHERAPY: "Physiotherapy session",
  SPEECH_THERAPY: "Speech therapy session",
  OCCUPATIONAL_THERAPY: "Occupational therapy session",
  HOME_NURSING_VISIT: "Home nursing visit",
  PHARMACY_CONSULTATION: "Pharmacy consultation",
  PUBLIC_HEALTH_VISIT: "Public health visit",
};

export type TimelineEntry = {
  id: string;
  date: Date;
  type:
    | "consultation"
    | "prescription"
    | "referral"
    | "appointment"
    | "rehab"
    | "therapySession"
    | "homeNursing"
    | "homeVisit";
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
  therapySessions: TherapySession[];
  homeNursingAssessments: HomeNursingAssessment[];
  homeVisits: HomeVisit[];
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
      title: APPOINTMENT_TYPE_LABELS[a.type] ?? a.type,
      subtitle: `Appointment (${a.status}) - ${a.staff.fullName}`,
      isUpcoming: a.scheduledAt > now,
    });
  }

  for (const ra of data.rehabAssessments) {
    const pendingCoSign = ra.therapist.role.name === "STUDENT" && !ra.coSignedAt;
    entries.push({
      id: ra.id,
      date: ra.createdAt,
      type: "rehab",
      title: `${DISCIPLINE_LABELS[ra.discipline]} assessment`,
      subtitle: `Rehabilitation - ${ra.therapist.fullName}${pendingCoSign ? " (pending co-sign)" : ra.treatmentPlan ? " (plan active)" : ""}`,
      isUpcoming: false,
    });
  }

  for (const s of data.therapySessions) {
    const pendingCoSign = s.therapist.role.name === "STUDENT" && !s.coSignedAt;
    entries.push({
      id: s.id,
      date: s.sessionDate,
      type: "therapySession",
      title: "Therapy session",
      subtitle: `Rehabilitation - ${s.therapist.fullName}${pendingCoSign ? " (pending co-sign)" : ""}`,
      isUpcoming: false,
    });
  }

  for (const hn of data.homeNursingAssessments) {
    const pendingCoSign = hn.nurse.role.name === "STUDENT" && !hn.coSignedAt;
    entries.push({
      id: hn.id,
      date: hn.createdAt,
      type: "homeNursing",
      title: "Home nursing assessment",
      subtitle: `Home Nursing - ${hn.nurse.fullName}${pendingCoSign ? " (pending co-sign)" : hn.carePlan ? " (plan active)" : ""}`,
      isUpcoming: false,
    });
  }

  for (const v of data.homeVisits) {
    const pendingCoSign = v.nurse.role.name === "STUDENT" && !v.coSignedAt;
    entries.push({
      id: v.id,
      date: v.visitDate,
      type: "homeVisit",
      title: "Home visit",
      subtitle: `Home Nursing - ${v.nurse.fullName}${pendingCoSign ? " (pending co-sign)" : ""}`,
      isUpcoming: false,
    });
  }

  return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
}
