import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .nullish()
  .transform((v) => (v && v !== "" ? v : undefined));

const optionalInt0to10 = z.coerce
  .number()
  .int()
  .min(0)
  .max(10)
  .nullish()
  .transform((v) => v ?? undefined);

const stringArray = z.array(z.string()).default([]);

// The Pediatric evaluation's milestone checklist - a fixed real list from
// the actual form, not free-form, so it's a shared constant rather than
// re-typed in the form component and the action.
export const PEDIATRIC_MILESTONES = [
  "Visual Tracking",
  "Head Control",
  "Rolling",
  "Sitting",
  "Quadruped",
  "Crawling",
  "Tall Kneeling",
  "Standing",
  "Walking",
] as const;

const milestoneSchema = z.object({
  milestone: z.string(),
  achieved: z.boolean(),
  assistLevel: optionalText,
});

// Hillside's own three real evaluation forms (Outpatient, Home Health,
// Pediatric) share this one schema - fields genuinely unique to one form
// are still optional here and simply left unset for the other two types.
export const rehabAssessmentSchema = z.object({
  discipline: z.enum(["PHYSIOTHERAPY", "SPEECH_THERAPY", "OCCUPATIONAL_THERAPY"]),
  evaluationType: z.enum(["OUTPATIENT", "HOME_HEALTH", "PEDIATRIC"]).default("OUTPATIENT"),
  findings: z.string().trim().min(1, "Findings are required"),
  functionalLimitations: optionalText,
  goals: optionalText,
  precautions: optionalText,
  notes: optionalText,

  // Shared across two or more forms
  chiefComplaint: optionalText,
  mechanismOfInjury: optionalText,
  dateOfOnset: optionalText,
  painType: stringArray,
  painAggravates: optionalText,
  painRelieves: optionalText,
  painTiming: stringArray,
  painTimingDetail: optionalText,
  painLevelWorst: optionalInt0to10,
  painLevelBest: optionalInt0to10,
  painLevelCurrent: optionalInt0to10,
  homeEquipment: optionalText,
  socialHistory: optionalText,
  medicationsAndTesting: optionalText,
  medicalScreenFlags: stringArray,
  sensoryExam: optionalText,
  reflexesExam: optionalText,
  patientGoals: optionalText,
  postureExam: optionalText,
  palpationExam: optionalText,
  gaitExam: optionalText,
  balanceExam: optionalText,
  fallsHistory: optionalText,
  strengthExam: optionalText,
  romExam: optionalText,
  specialTestsNote: optionalText,
  furtherObjectiveTesting: optionalText,
  ptRecommendedFrequency: optionalText,
  initialTreatmentPlan: optionalText,
  referralsNote: optionalText,
  shortTermGoals: stringArray,
  longTermGoals: stringArray,

  // Home Health only
  vitalsBp: optionalText,
  vitalsHr: optionalText,
  vitalsO2: optionalText,
  vitalsTemp: optionalText,
  priorTreatment: optionalText,
  generalHealth: optionalText,
  priorFunctionalLevelAdUse: optionalText,
  bedMobilityExam: optionalText,
  transfersExam: optionalText,
  adlsExam: optionalText,
  motorExam: optionalText,
  coordinationExam: optionalText,
  fatigueExam: optionalText,
  confusionMemoryExam: optionalText,
  hearingVisionSpeechExam: optionalText,
  otherNeuroFindings: optionalText,

  // Pediatric only
  village: optionalText,
  caregiver1: optionalText,
  caregiver2: optionalText,
  secondaryConcern: optionalText,
  birthHistory: optionalText,
  milestoneHistoryNote: optionalText,
  relevantFamilyHistory: optionalText,
  relevantHomeEnvironment: optionalText,
  babySleepingEnvironment: optionalText,
  familyGoals: optionalText,
  behavioralObservation: optionalText,
  followingDirections: optionalText,
  strengthsNote: optionalText,
  milestonesComment: optionalText,
  grossMotorNote: optionalText,
  neuromotorMuscleToneNote: optionalText,
  sensorimotorNote: optionalText,
  activityLimitationsNote: optionalText,
  assistiveDevicesPresent: optionalText,
  assistiveDevicesRecommended: optionalText,
  ptDiagnosisPrognosisJustification: optionalText,

  milestones: z.array(milestoneSchema).default([]),
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
