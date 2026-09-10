import { z } from "zod";

const optionalNumber = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? Number(v) : undefined))
  .refine((v) => v === undefined || !Number.isNaN(v), "Must be a number");

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v !== "" ? v : undefined));

export const consultationInputSchema = z.object({
  chiefComplaint: z.string().trim().min(1, "Chief complaint is required"),
  historyOfPresentIllness: optionalText,
  examinationNotes: optionalText,
  assessment: optionalText,
  treatmentNotes: optionalText,
  notes: optionalText,
  diagnosisDescription: optionalText,

  temperatureC: optionalNumber,
  heartRateBpm: optionalNumber,
  respiratoryRatePerMin: optionalNumber,
  bloodPressureSystolic: optionalNumber,
  bloodPressureDiastolic: optionalNumber,
  oxygenSaturationPercent: optionalNumber,
  weightKg: optionalNumber,
  heightCm: optionalNumber,
});

export type ConsultationInput = z.infer<typeof consultationInputSchema>;
