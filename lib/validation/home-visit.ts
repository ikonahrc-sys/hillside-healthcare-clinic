import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .nullish()
  .transform((v) => (v && v !== "" ? v : undefined));

export const homeVisitSchema = z.object({
  careProvided: z.string().trim().min(1, "Care provided is required"),
  patientCondition: optionalText,
  notes: optionalText,
});

export type HomeVisitInput = z.infer<typeof homeVisitSchema>;
