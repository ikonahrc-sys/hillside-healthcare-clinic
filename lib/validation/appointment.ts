import { z } from "zod";
import { parseFacilityLocalDateTime } from "@/lib/utils/schedule";

// Shared shape for scheduling any appointment type - a date/time plus
// optional notes. Named generically since Medical's follow-up and Rehab's
// therapy session scheduling both use it as-is.
export const scheduleAppointmentSchema = z.object({
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

export const scheduleFollowUpSchema = scheduleAppointmentSchema;
export type ScheduleFollowUpInput = ScheduleAppointmentInput;
