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

export async function scheduleFollowUp(
  user: CurrentUser | null,
  patientId: string,
  input: ScheduleAppointmentInput,
) {
  const authedUser = await authorize(user, "appointment:manage");
  return createAppointment(authedUser, patientId, "MEDICAL_FOLLOW_UP", input);
}

// A therapist's discipline maps 1:1 to their role, same as how a doctor's
// department is always MED - no separate "pick a discipline" step needed.
const REHAB_APPOINTMENT_TYPE_BY_ROLE: Record<string, AppointmentType> = {
  PHYSIOTHERAPIST: "PHYSIOTHERAPY",
  SPEECH_THERAPIST: "SPEECH_THERAPY",
  OCCUPATIONAL_THERAPIST: "OCCUPATIONAL_THERAPY",
};

export async function scheduleTherapyAppointment(
  user: CurrentUser | null,
  patientId: string,
  input: ScheduleAppointmentInput,
) {
  const authedUser = await authorize(user, "appointment:manage");

  const type = REHAB_APPOINTMENT_TYPE_BY_ROLE[authedUser.role.name];
  if (!type) {
    throw new Error("Your role cannot schedule therapy appointments.");
  }

  return createAppointment(authedUser, patientId, type, input);
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
