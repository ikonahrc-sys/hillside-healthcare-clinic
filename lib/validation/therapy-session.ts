import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .nullish()
  .transform((v) => (v && v !== "" ? v : undefined));

// Real SOAP structure, matching Hillside's own progress note template.
export const therapySessionSchema = z.object({
  subjective: z.string().trim().min(1, "Subjective is required"),
  objective: z.string().trim().min(1, "Objective is required"),
  setting: z.enum(["CLINIC", "HOME_HEALTH_VISIT", "MOBILE_CLINIC"]).default("CLINIC"),
  assessment: optionalText,
  plan: optionalText,
  homeExerciseProgram: optionalText,
  additionalNotes: optionalText,
});

export type TherapySessionInput = z.infer<typeof therapySessionSchema>;
