import { z } from "zod";

export const outreachVisitSchema = z.object({
  visitDate: z.coerce.date({ message: "Visit date is required" }),
  location: z.string().trim().min(1, "Location is required"),
  activity: z.string().trim().min(1, "Activity description is required"),
  peopleReached: z.coerce.number().int().nonnegative("Must be zero or more"),
  notes: z
    .string()
    .trim()
    .nullish()
    .transform((v) => (v && v !== "" ? v : undefined)),
});

export type OutreachVisitInput = z.infer<typeof outreachVisitSchema>;

export const surveillanceCaseSchema = z.object({
  diseaseName: z.string().trim().min(1, "Disease name is required"),
  reportDate: z.coerce.date({ message: "Report date is required" }),
  location: z.string().trim().min(1, "Location is required"),
  status: z.enum(["INVESTIGATING", "CONFIRMED", "RESOLVED"]).default("INVESTIGATING"),
  patientId: z
    .string()
    .trim()
    .nullish()
    .transform((v) => (v && v !== "" ? v : undefined)),
  notes: z
    .string()
    .trim()
    .nullish()
    .transform((v) => (v && v !== "" ? v : undefined)),
});

export type SurveillanceCaseInput = z.infer<typeof surveillanceCaseSchema>;
