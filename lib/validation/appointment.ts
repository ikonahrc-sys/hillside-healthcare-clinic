import { z } from "zod";
import { parseFacilityLocalDateTime } from "@/lib/utils/schedule";

// One shared schema for booking any department's appointment - the type
// itself is validated separately against the booking user's actual role
// (see getAvailableAppointmentTypes/scheduleAppointment), not baked in
// here, since which types are legal depends on who's submitting the form.
export const APPOINTMENT_TYPE_VALUES = [
  "MEDICAL_FOLLOW_UP",
  "PHYSIOTHERAPY",
  "SPEECH_THERAPY",
  "OCCUPATIONAL_THERAPY",
  "HOME_NURSING_VISIT",
  "PHARMACY_CONSULTATION",
  "PUBLIC_HEALTH_VISIT",
] as const;

export const scheduleAppointmentSchema = z.object({
  type: z.enum(APPOINTMENT_TYPE_VALUES),
  // A datetime-local input's value has no timezone attached - it must be
  // interpreted as facility-local (Belize) time explicitly, not parsed with
  // z.coerce.date() (which would use the server's own OS timezone).
  scheduledAt: z
    .string()
    .transform((raw) => parseFacilityLocalDateTime(raw))
    .refine((d) => !Number.isNaN(d.getTime()), "Invalid date/time")
    .refine((d) => d.getTime() > Date.now(), {
      message: "Appointment must be scheduled in the future",
    }),
  notes: z
    .string()
    .trim()
    .nullish()
    .transform((v) => (v && v !== "" ? v : undefined)),
});

export type ScheduleAppointmentInput = z.infer<typeof scheduleAppointmentSchema>;
