import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .nullish()
  .transform((v) => (v && v !== "" ? v : undefined));

export const therapySessionSchema = z.object({
  activities: z.string().trim().min(1, "Activities are required"),
  progress: optionalText,
  notes: optionalText,
});

export type TherapySessionInput = z.infer<typeof therapySessionSchema>;
