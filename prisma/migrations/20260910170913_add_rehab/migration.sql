-- CreateEnum
CREATE TYPE "RehabDiscipline" AS ENUM ('PHYSIOTHERAPY', 'SPEECH_THERAPY', 'OCCUPATIONAL_THERAPY');

-- CreateEnum
CREATE TYPE "TreatmentPlanStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'DISCONTINUED');

-- CreateTable
CREATE TABLE "RehabAssessment" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "referralId" TEXT,
    "therapistId" TEXT NOT NULL,
    "discipline" "RehabDiscipline" NOT NULL,
    "findings" TEXT NOT NULL,
    "functionalLimitations" TEXT,
    "goals" TEXT,
    "precautions" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RehabAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RehabTreatmentPlan" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "therapistId" TEXT NOT NULL,
    "goals" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3),
    "precautions" TEXT,
    "status" "TreatmentPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RehabTreatmentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RehabAssessment_patientId_idx" ON "RehabAssessment"("patientId");

-- CreateIndex
CREATE INDEX "RehabAssessment_therapistId_idx" ON "RehabAssessment"("therapistId");

-- CreateIndex
CREATE UNIQUE INDEX "RehabTreatmentPlan_assessmentId_key" ON "RehabTreatmentPlan"("assessmentId");

-- CreateIndex
CREATE INDEX "RehabTreatmentPlan_patientId_idx" ON "RehabTreatmentPlan"("patientId");

-- CreateIndex
CREATE INDEX "RehabTreatmentPlan_therapistId_idx" ON "RehabTreatmentPlan"("therapistId");

-- AddForeignKey
ALTER TABLE "RehabAssessment" ADD CONSTRAINT "RehabAssessment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RehabAssessment" ADD CONSTRAINT "RehabAssessment_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RehabAssessment" ADD CONSTRAINT "RehabAssessment_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RehabTreatmentPlan" ADD CONSTRAINT "RehabTreatmentPlan_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "RehabAssessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RehabTreatmentPlan" ADD CONSTRAINT "RehabTreatmentPlan_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RehabTreatmentPlan" ADD CONSTRAINT "RehabTreatmentPlan_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
