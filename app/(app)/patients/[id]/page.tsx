import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getPatientById, formatMrn } from "@/lib/services/patient-service";
import { listConsultationsForPatient } from "@/lib/services/consultation-service";
import { listReferralsForPatient } from "@/lib/services/referral-service";
import { listPrescriptionsForPatient } from "@/lib/services/prescription-service";
import { listAppointmentsForPatient } from "@/lib/services/appointment-service";
import { listRehabAssessmentsForPatient } from "@/lib/services/rehab-service";
import { can } from "@/lib/auth/authorize";
import { calculateAge } from "@/lib/utils/age";
import { buildPatientTimeline } from "@/lib/utils/timeline";
import { PatientTabs } from "@/components/patients/patient-tabs";
import { OverviewTab } from "@/components/patients/overview-tab";
import { TimelineTab } from "@/components/patients/timeline-tab";
import { ConsultationsTab } from "@/components/patients/consultations-tab";
import { PrescriptionsTab } from "@/components/patients/prescriptions-tab";
import { ReferralsTab } from "@/components/patients/referrals-tab";
import { RehabilitationTab } from "@/components/patients/rehabilitation-tab";

const VALID_TABS = [
  "overview",
  "timeline",
  "consultations",
  "prescriptions",
  "referrals",
  "rehabilitation",
];

export default async function PatientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: tabParam } = await searchParams;
  const activeTab = VALID_TABS.includes(tabParam ?? "") ? tabParam! : "overview";

  const user = await getCurrentUser();
  const patient = await getPatientById(user, id);

  if (!patient) {
    notFound();
  }

  const [
    consultations,
    referrals,
    prescriptions,
    appointments,
    rehabAssessments,
    canCreateConsultation,
    canManageReferrals,
    canCreatePrescription,
    canManageAppointments,
    canManageRehab,
  ] = await Promise.all([
    listConsultationsForPatient(user, patient.id),
    listReferralsForPatient(user, patient.id),
    listPrescriptionsForPatient(user, patient.id),
    listAppointmentsForPatient(user, patient.id),
    listRehabAssessmentsForPatient(user, patient.id),
    user ? can(user, "consultation:create") : Promise.resolve(false),
    user ? can(user, "referral:manage") : Promise.resolve(false),
    user ? can(user, "prescription:create") : Promise.resolve(false),
    user ? can(user, "appointment:manage") : Promise.resolve(false),
    user ? can(user, "rehab:manage") : Promise.resolve(false),
  ]);

  const timelineEntries = buildPatientTimeline({
    consultations,
    prescriptions,
    referrals,
    appointments,
    rehabAssessments,
  });

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-slate-900">
          {patient.lastName}, {patient.firstName}
        </h1>
        <p className="text-sm text-slate-500">
          {formatMrn(patient.mrnNumber)} - {calculateAge(patient.dateOfBirth)}{" "}
          years old - {patient.sex}
        </p>
      </div>

      <PatientTabs patientId={patient.id} active={activeTab} />

      {activeTab === "overview" && <OverviewTab patient={patient} />}
      {activeTab === "timeline" && <TimelineTab entries={timelineEntries} />}
      {activeTab === "consultations" && (
        <ConsultationsTab
          patientId={patient.id}
          consultations={consultations}
          canManageAppointments={canManageAppointments}
          canCreateConsultation={canCreateConsultation}
        />
      )}
      {activeTab === "prescriptions" && (
        <PrescriptionsTab
          patientId={patient.id}
          prescriptions={prescriptions}
          canCreatePrescription={canCreatePrescription}
        />
      )}
      {activeTab === "referrals" && (
        <ReferralsTab
          patientId={patient.id}
          referrals={referrals}
          canManageReferrals={canManageReferrals}
          canManageRehab={canManageRehab}
        />
      )}
      {activeTab === "rehabilitation" && (
        <RehabilitationTab
          patientId={patient.id}
          assessments={rehabAssessments}
          canManage={canManageRehab}
        />
      )}
    </div>
  );
}
