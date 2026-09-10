import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .nullish()
  .transform((v) => (v && v !== "" ? v : undefined));

export const rehabAssessmentSchema = z.object({
  discipline: z.enum(["PHYSIOTHERAPY", "SPEECH_THERAPY", "OCCUPATIONAL_THERAPY"]),
  findings: z.string().trim().min(1, "Findings are required"),
  functionalLimitations: optionalText,
  goals: optionalText,
  precautions: optionalText,
  notes: optionalText,
});

export type RehabAssessmentInput = z.infer<typeof rehabAssessmentSchema>;

export const rehabTreatmentPlanSchema = z.object({
  goals: z.string().trim().min(1, "Goals are required"),
  frequency: z.string().trim().min(1, "Frequency is required"),
  // Date-only string - UTC midnight per spec regardless of system
  // timezone, safe with z.coerce.date() directly (same reasoning as the
  // inventory expiryDate field).
  reviewDate: z
    .string()
    .trim()
    .nullish()
    .transform((v) => (v && v !== "" ? new Date(v) : undefined)),
  precautions: optionalText,
});

export type RehabTreatmentPlanInput = z.infer<typeof rehabTreatmentPlanSchema>;
