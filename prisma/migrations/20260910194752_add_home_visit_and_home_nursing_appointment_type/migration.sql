-- AlterEnum
ALTER TYPE "AppointmentType" ADD VALUE 'HOME_NURSING_VISIT';

-- CreateTable
CREATE TABLE "HomeVisit" (
    "id" TEXT NOT NULL,
    "carePlanId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "nurseId" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "careProvided" TEXT NOT NULL,
    "patientCondition" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HomeVisit_carePlanId_idx" ON "HomeVisit"("carePlanId");

-- CreateIndex
CREATE INDEX "HomeVisit_patientId_idx" ON "HomeVisit"("patientId");

-- CreateIndex
CREATE INDEX "HomeVisit_nurseId_idx" ON "HomeVisit"("nurseId");

-- AddForeignKey
ALTER TABLE "HomeVisit" ADD CONSTRAINT "HomeVisit_carePlanId_fkey" FOREIGN KEY ("carePlanId") REFERENCES "HomeNursingCarePlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeVisit" ADD CONSTRAINT "HomeVisit_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeVisit" ADD CONSTRAINT "HomeVisit_nurseId_fkey" FOREIGN KEY ("nurseId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
