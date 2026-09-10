import { z } from "zod";
import { parseFacilityLocalDateTime } from "@/lib/utils/schedule";

export const scheduleFollowUpSchema = z.object({
  // A datetime-local input's value has no timezone attached - it must be
  // interpreted as facility-local (Belize) time explicitly, not parsed with
  // z.coerce.date() (which would use the server's own OS timezone).
  scheduledAt: z
    .string()
    .transform((raw) => parseFacilityLocalDateTime(raw))
    .refine((d) => !Number.isNaN(d.getTime()), "Invalid date/time")
    .refine((d) => d.getTime() > Date.now(), {
      message: "Follow-up must be scheduled in the future",
    }),
  notes: z
    .string()
    .trim()
    .nullish()
    .transform((v) => (v && v !== "" ? v : undefined)),
});

export type ScheduleFollowUpInput = z.infer<typeof scheduleFollowUpSchema>;
