-- CreateEnum
CREATE TYPE "RehabEvaluationType" AS ENUM ('OUTPATIENT', 'HOME_HEALTH', 'PEDIATRIC');

-- AlterTable
ALTER TABLE "RehabAssessment" ADD COLUMN     "activityLimitationsNote" TEXT,
ADD COLUMN     "adlsExam" TEXT,
ADD COLUMN     "assistiveDevicesPresent" TEXT,
ADD COLUMN     "assistiveDevicesRecommended" TEXT,
ADD COLUMN     "babySleepingEnvironment" TEXT,
ADD COLUMN     "balanceExam" TEXT,
ADD COLUMN     "bedMobilityExam" TEXT,
ADD COLUMN     "behavioralObservation" TEXT,
ADD COLUMN     "birthHistory" TEXT,
ADD COLUMN     "caregiver1" TEXT,
ADD COLUMN     "caregiver2" TEXT,
ADD COLUMN     "chiefComplaint" TEXT,
ADD COLUMN     "confusionMemoryExam" TEXT,
ADD COLUMN     "coordinationExam" TEXT,
ADD COLUMN     "dateOfOnset" TEXT,
ADD COLUMN     "evaluationType" "RehabEvaluationType" NOT NULL DEFAULT 'OUTPATIENT',
ADD COLUMN     "fallsHistory" TEXT,
ADD COLUMN     "familyGoals" TEXT,
ADD COLUMN     "fatigueExam" TEXT,
ADD COLUMN     "followingDirections" TEXT,
ADD COLUMN     "furtherObjectiveTesting" TEXT,
ADD COLUMN     "gaitExam" TEXT,
ADD COLUMN     "generalHealth" TEXT,
ADD COLUMN     "grossMotorNote" TEXT,
ADD COLUMN     "hearingVisionSpeechExam" TEXT,
ADD COLUMN     "homeEquipment" TEXT,
ADD COLUMN     "initialTreatmentPlan" TEXT,
ADD COLUMN     "longTermGoals" TEXT[],
ADD COLUMN     "mechanismOfInjury" TEXT,
ADD COLUMN     "medicalScreenFlags" TEXT[],
ADD COLUMN     "medicationsAndTesting" TEXT,
ADD COLUMN     "milestoneHistoryNote" TEXT,
ADD COLUMN     "milestonesComment" TEXT,
ADD COLUMN     "motorExam" TEXT,
ADD COLUMN     "neuromotorMuscleToneNote" TEXT,
ADD COLUMN     "otherNeuroFindings" TEXT,
ADD COLUMN     "painAggravates" TEXT,
ADD COLUMN     "painLevelBest" INTEGER,
ADD COLUMN     "painLevelCurrent" INTEGER,
ADD COLUMN     "painLevelWorst" INTEGER,
ADD COLUMN     "painRelieves" TEXT,
ADD COLUMN     "painTiming" TEXT[],
ADD COLUMN     "painTimingDetail" TEXT,
ADD COLUMN     "painType" TEXT[],
ADD COLUMN     "palpationExam" TEXT,
ADD COLUMN     "patientGoals" TEXT,
ADD COLUMN     "postureExam" TEXT,
ADD COLUMN     "priorFunctionalLevelAdUse" TEXT,
ADD COLUMN     "priorTreatment" TEXT,
ADD COLUMN     "ptDiagnosisPrognosisJustification" TEXT,
ADD COLUMN     "ptRecommendedFrequency" TEXT,
ADD COLUMN     "referralsNote" TEXT,
ADD COLUMN     "reflexesExam" TEXT,
ADD COLUMN     "relevantFamilyHistory" TEXT,
ADD COLUMN     "relevantHomeEnvironment" TEXT,
ADD COLUMN     "romExam" TEXT,
ADD COLUMN     "secondaryConcern" TEXT,
ADD COLUMN     "sensorimotorNote" TEXT,
ADD COLUMN     "sensoryExam" TEXT,
ADD COLUMN     "shortTermGoals" TEXT[],
ADD COLUMN     "socialHistory" TEXT,
ADD COLUMN     "specialTestsNote" TEXT,
ADD COLUMN     "strengthExam" TEXT,
ADD COLUMN     "strengthsNote" TEXT,
ADD COLUMN     "transfersExam" TEXT,
ADD COLUMN     "village" TEXT,
ADD COLUMN     "vitalsBp" TEXT,
ADD COLUMN     "vitalsHr" TEXT,
ADD COLUMN     "vitalsO2" TEXT,
ADD COLUMN     "vitalsTemp" TEXT;

-- AlterTable: add new SOAP columns first (nullable/defaulted), migrate
-- existing data across, THEN drop the old columns - a plain rename would
-- have silently discarded every already-authored (and some already
-- co-signed) therapy session's content.
ALTER TABLE "TherapySession" ADD COLUMN     "additionalNotes" TEXT,
ADD COLUMN     "assessment" TEXT,
ADD COLUMN     "homeExerciseProgram" TEXT,
ADD COLUMN     "objective" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "plan" TEXT,
ADD COLUMN     "subjective" TEXT NOT NULL DEFAULT '';

UPDATE "TherapySession" SET
  "objective" = COALESCE("activities", ''),
  "assessment" = "progress",
  "additionalNotes" = "notes";

ALTER TABLE "TherapySession" DROP COLUMN "activities",
DROP COLUMN "notes",
DROP COLUMN "progress";

-- CreateTable
CREATE TABLE "RehabMilestoneRecord" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "milestone" TEXT NOT NULL,
    "achieved" BOOLEAN NOT NULL,
    "assistLevel" TEXT,

    CONSTRAINT "RehabMilestoneRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RehabMilestoneRecord_assessmentId_idx" ON "RehabMilestoneRecord"("assessmentId");

-- AddForeignKey
ALTER TABLE "RehabMilestoneRecord" ADD CONSTRAINT "RehabMilestoneRecord_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "RehabAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
