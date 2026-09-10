import "server-only";
import { prisma } from "@/lib/db";
import { authorize } from "@/lib/auth/authorize";
import { logAudit } from "@/lib/audit/log";
import { getFacilityDayRange } from "@/lib/utils/schedule";
import type { CurrentUser } from "@/lib/auth/session";
import type { ScheduleFollowUpInput } from "@/lib/validation/appointment";

export async function scheduleFollowUp(
  user: CurrentUser | null,
  patientId: string,
  input: ScheduleFollowUpInput,
) {
  const authedUser = await authorize(user, "appointment:manage");

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
      type: "MEDICAL_FOLLOW_UP",
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

const scheduleInclude = {
  patient: { select: { id: true, firstName: true, lastName: true, mrnNumber: true } },
  staff: { select: { fullName: true } },
} as const;

export async function getMedicalSchedule(user: CurrentUser | null) {
  await authorize(user, "appointment:manage");

  const medDepartment = await prisma.department.findUnique({ where: { code: "MED" } });
  if (!medDepartment) {
    return { today: [], tomorrow: [], upcoming: [] };
  }

  const today = getFacilityDayRange(0);
  const tomorrow = getFacilityDayRange(1);
  const upcomingCutoff = getFacilityDayRange(14).end;

  const baseWhere = {
    departmentId: medDepartment.id,
    status: { notIn: ["CANCELLED", "COMPLETED"] as ("CANCELLED" | "COMPLETED")[] },
  };

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
