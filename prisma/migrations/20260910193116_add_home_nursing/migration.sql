-- CreateTable
CREATE TABLE "HomeNursingAssessment" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "referralId" TEXT,
    "nurseId" TEXT NOT NULL,
    "findings" TEXT NOT NULL,
    "careNeeds" TEXT,
    "precautions" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeNursingAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeNursingCarePlan" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "nurseId" TEXT NOT NULL,
    "goals" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3),
    "precautions" TEXT,
    "status" "TreatmentPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeNursingCarePlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HomeNursingAssessment_patientId_idx" ON "HomeNursingAssessment"("patientId");

-- CreateIndex
CREATE INDEX "HomeNursingAssessment_nurseId_idx" ON "HomeNursingAssessment"("nurseId");

-- CreateIndex
CREATE UNIQUE INDEX "HomeNursingCarePlan_assessmentId_key" ON "HomeNursingCarePlan"("assessmentId");

-- CreateIndex
CREATE INDEX "HomeNursingCarePlan_patientId_idx" ON "HomeNursingCarePlan"("patientId");

-- CreateIndex
CREATE INDEX "HomeNursingCarePlan_nurseId_idx" ON "HomeNursingCarePlan"("nurseId");

-- AddForeignKey
ALTER TABLE "HomeNursingAssessment" ADD CONSTRAINT "HomeNursingAssessment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeNursingAssessment" ADD CONSTRAINT "HomeNursingAssessment_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeNursingAssessment" ADD CONSTRAINT "HomeNursingAssessment_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeNursingCarePlan" ADD CONSTRAINT "HomeNursingCarePlan_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "HomeNursingAssessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeNursingCarePlan" ADD CONSTRAINT "HomeNursingCarePlan_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeNursingCarePlan" ADD CONSTRAINT "HomeNursingCarePlan_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
