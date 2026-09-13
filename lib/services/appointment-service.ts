import "server-only";
import { prisma } from "@/lib/db";
import { authorize } from "@/lib/auth/authorize";
import { logAudit } from "@/lib/audit/log";
import { getFacilityDayRange } from "@/lib/utils/schedule";
import type { CurrentUser } from "@/lib/auth/session";
import type { ScheduleAppointmentInput } from "@/lib/validation/appointment";
import type { AppointmentType } from "@/app/generated/prisma/client";

async function createAppointment(
  authedUser: NonNullable<CurrentUser>,
  patientId: string,
  type: AppointmentType,
  input: ScheduleAppointmentInput,
) {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, deletedAt: null },
  });
  if (!patient) {
    throw new Error("Patient not found");
  }

  if (!authedUser.departmentId) {
    throw new Error("Your account has no department assigned - cannot schedule an appointment.");
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      departmentId: authedUser.departmentId,
      staffId: authedUser.id,
      type,
      scheduledAt: input.scheduledAt,
      notes: input.notes,
    },
  });

  await logAudit({
    actorId: authedUser.id,
    actorEmail: authedUser.email,
    action: "APPOINTMENT_SCHEDULE",
    entityType: "Appointment",
    entityId: appointment.id,
    metadata: { patientId: patient.id, scheduledAt: input.scheduledAt },
  });

  return appointment;
}

// One central point for bookings: every department's staff schedule
// through this same map + the one scheduleAppointment() below, rather
// than each department having its own schedule*() function. A role that
// spans multiple appointment types (e.g. a Rehab director overseeing all
// three disciplines) gets to choose; a role with exactly one just has it
// preselected in the form.
const ROLE_APPOINTMENT_TYPES: Record<string, AppointmentType[]> = {
  ADMINISTRATOR: [
    "MEDICAL_FOLLOW_UP",
    "PHYSIOTHERAPY",
    "SPEECH_THERAPY",
    "OCCUPATIONAL_THERAPY",
    "HOME_NURSING_VISIT",
    "PHARMACY_CONSULTATION",
    "PUBLIC_HEALTH_VISIT",
  ],
  DOCTOR: ["MEDICAL_FOLLOW_UP"],
  MEDICAL_DIRECTOR: ["MEDICAL_FOLLOW_UP"],
  PHYSIOTHERAPIST: ["PHYSIOTHERAPY"],
  SPEECH_THERAPIST: ["SPEECH_THERAPY"],
  OCCUPATIONAL_THERAPIST: ["OCCUPATIONAL_THERAPY"],
  REHABILITATION_DIRECTOR: ["PHYSIOTHERAPY", "SPEECH_THERAPY", "OCCUPATIONAL_THERAPY"],
  HOME_NURSING_STAFF: ["HOME_NURSING_VISIT"],
  HEAD_OF_NURSING: ["HOME_NURSING_VISIT"],
  PHARMACIST: ["PHARMACY_CONSULTATION"],
  HEAD_OF_PHARMACY: ["PHARMACY_CONSULTATION"],
  PUBLIC_HEALTH_DIRECTOR: ["PUBLIC_HEALTH_VISIT"],
};

export async function getAvailableAppointmentTypes(
  user: CurrentUser | null,
): Promise<AppointmentType[]> {
  const authedUser = await authorize(user, "appointment:manage");
  return ROLE_APPOINTMENT_TYPES[authedUser.role.name] ?? [];
}

export async function scheduleAppointment(
  user: CurrentUser | null,
  patientId: string,
  input: ScheduleAppointmentInput,
) {
  const authedUser = await authorize(user, "appointment:manage");

  const allowedTypes = ROLE_APPOINTMENT_TYPES[authedUser.role.name] ?? [];
  if (!allowedTypes.includes(input.type)) {
    throw new Error("Your role cannot schedule this type of appointment.");
  }

  return createAppointment(authedUser, patientId, input.type, input);
}

export async function listAppointmentsForPatient(
  user: CurrentUser | null,
  patientId: string,
) {
  await authorize(user, "patient:read");

  return prisma.appointment.findMany({
    where: { patientId },
    include: { staff: { select: { fullName: true } } },
    orderBy: { scheduledAt: "desc" },
  });
}

const scheduleInclude = {
  patient: { select: { id: true, firstName: true, lastName: true, mrnNumber: true } },
  staff: { select: { fullName: true } },
} as const;

// Shared Today/Tomorrow/Upcoming(14 days) windowing, reused by every
// department's dashboard - only the filter narrowing which appointments
// count differs between them.
async function getScheduleWindows(baseWhere: {
  departmentId?: string;
  staffId?: string;
  type?: { in: AppointmentType[] };
  status: { notIn: ("CANCELLED" | "COMPLETED")[] };
}) {
  const today = getFacilityDayRange(0);
  const tomorrow = getFacilityDayRange(1);
  const upcomingCutoff = getFacilityDayRange(14).end;

  const [todayAppts, tomorrowAppts, upcomingAppts] = await Promise.all([
    prisma.appointment.findMany({
      where: { ...baseWhere, scheduledAt: { gte: today.start, lt: today.end } },
      include: scheduleInclude,
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.appointment.findMany({
      where: { ...baseWhere, scheduledAt: { gte: tomorrow.start, lt: tomorrow.end } },
      include: scheduleInclude,
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.appointment.findMany({
      where: { ...baseWhere, scheduledAt: { gte: tomorrow.end, lt: upcomingCutoff } },
      include: scheduleInclude,
      orderBy: { scheduledAt: "asc" },
      take: 20,
    }),
  ]);

  return { today: todayAppts, tomorrow: tomorrowAppts, upcoming: upcomingAppts };
}

export async function getMedicalSchedule(user: CurrentUser | null) {
  await authorize(user, "appointment:manage");

  const medDepartment = await prisma.department.findUnique({ where: { code: "MED" } });
  if (!medDepartment) {
    return { today: [], tomorrow: [], upcoming: [] };
  }

  return getScheduleWindows({
    departmentId: medDepartment.id,
    status: { notIn: ["CANCELLED", "COMPLETED"] },
  });
}

// Scoped to the individual therapist, not the whole Rehab department - a
// physiotherapist wants "my patients today", not Speech/OT colleagues'
// appointments mixed in, since the three disciplines run independently.
export async function getRehabSchedule(user: CurrentUser | null) {
  const authedUser = await authorize(user, "appointment:manage");

  return getScheduleWindows({
    staffId: authedUser.id,
    type: { in: ["PHYSIOTHERAPY", "SPEECH_THERAPY", "OCCUPATIONAL_THERAPY"] },
    status: { notIn: ["CANCELLED", "COMPLETED"] },
  });
}

// Scoped to the individual nurse, same reasoning as getRehabSchedule - a
// nurse wants "my home visits today", not every nurse's caseload.
export async function getHomeNursingSchedule(user: CurrentUser | null) {
  const authedUser = await authorize(user, "appointment:manage");

  return getScheduleWindows({
    staffId: authedUser.id,
    type: { in: ["HOME_NURSING_VISIT"] },
    status: { notIn: ["CANCELLED", "COMPLETED"] },
  });
}

// Department-wide like Medical, not staff-scoped like Rehab/Home Nursing -
// pharmacy consultations are a shared queue, not one pharmacist's caseload.
export async function getPharmacySchedule(user: CurrentUser | null) {
  await authorize(user, "appointment:manage");

  const pharmDepartment = await prisma.department.findUnique({ where: { code: "PHARM" } });
  if (!pharmDepartment) {
    return { today: [], tomorrow: [], upcoming: [] };
  }

  return getScheduleWindows({
    departmentId: pharmDepartment.id,
    status: { notIn: ["CANCELLED", "COMPLETED"] },
  });
}

// Department-wide, same reasoning as getPharmacySchedule.
export async function getPublicHealthSchedule(user: CurrentUser | null) {
  await authorize(user, "appointment:manage");

  const phDepartment = await prisma.department.findUnique({ where: { code: "PH" } });
  if (!phDepartment) {
    return { today: [], tomorrow: [], upcoming: [] };
  }

  return getScheduleWindows({
    departmentId: phDepartment.id,
    status: { notIn: ["CANCELLED", "COMPLETED"] },
  });
}
