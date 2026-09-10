import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .nullish()
  .transform((v) => (v && v !== "" ? v : undefined));

export const homeNursingAssessmentSchema = z.object({
  findings: z.string().trim().min(1, "Findings are required"),
  careNeeds: optionalText,
  precautions: optionalText,
  notes: optionalText,
});

export type HomeNursingAssessmentInput = z.infer<typeof homeNursingAssessmentSchema>;

export const homeNursingCarePlanSchema = z.object({
  goals: z.string().trim().min(1, "Goals are required"),
  frequency: z.string().trim().min(1, "Frequency is required"),
  // Date-only string - UTC midnight per spec regardless of system
  // timezone, safe with z.coerce.date() directly (same reasoning as
  // RehabTreatmentPlan's reviewDate).
  reviewDate: z
    .string()
    .trim()
    .nullish()
    .transform((v) => (v && v !== "" ? new Date(v) : undefined)),
  precautions: optionalText,
});

export type HomeNursingCarePlanInput = z.infer<typeof homeNursingCarePlanSchema>;
