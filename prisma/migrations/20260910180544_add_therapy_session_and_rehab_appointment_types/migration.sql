-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AppointmentType" ADD VALUE 'PHYSIOTHERAPY';
ALTER TYPE "AppointmentType" ADD VALUE 'SPEECH_THERAPY';
ALTER TYPE "AppointmentType" ADD VALUE 'OCCUPATIONAL_THERAPY';

-- CreateTable
CREATE TABLE "TherapySession" (
    "id" TEXT NOT NULL,
    "treatmentPlanId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activities" TEXT NOT NULL,
    "progress" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TherapySession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TherapySession_treatmentPlanId_idx" ON "TherapySession"("treatmentPlanId");

-- CreateIndex
CREATE INDEX "TherapySession_patientId_idx" ON "TherapySession"("patientId");

-- CreateIndex
CREATE INDEX "TherapySession_therapistId_idx" ON "TherapySession"("therapistId");

-- AddForeignKey
ALTER TABLE "TherapySession" ADD CONSTRAINT "TherapySession_treatmentPlanId_fkey" FOREIGN KEY ("treatmentPlanId") REFERENCES "RehabTreatmentPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TherapySession" ADD CONSTRAINT "TherapySession_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TherapySession" ADD CONSTRAINT "TherapySession_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
