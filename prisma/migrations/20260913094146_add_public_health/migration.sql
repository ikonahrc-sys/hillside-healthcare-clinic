-- CreateEnum
CREATE TYPE "SurveillanceCaseStatus" AS ENUM ('INVESTIGATING', 'CONFIRMED', 'RESOLVED');

-- CreateTable
CREATE TABLE "CommunityOutreachVisit" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "peopleReached" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityOutreachVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiseaseSurveillanceCase" (
    "id" TEXT NOT NULL,
    "patientId" TEXT,
    "reportedByUserId" TEXT NOT NULL,
    "diseaseName" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" TEXT NOT NULL,
    "status" "SurveillanceCaseStatus" NOT NULL DEFAULT 'INVESTIGATING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiseaseSurveillanceCase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunityOutreachVisit_staffId_idx" ON "CommunityOutreachVisit"("staffId");

-- CreateIndex
CREATE INDEX "CommunityOutreachVisit_visitDate_idx" ON "CommunityOutreachVisit"("visitDate");

-- CreateIndex
CREATE INDEX "DiseaseSurveillanceCase_patientId_idx" ON "DiseaseSurveillanceCase"("patientId");

-- CreateIndex
CREATE INDEX "DiseaseSurveillanceCase_reportedByUserId_idx" ON "DiseaseSurveillanceCase"("reportedByUserId");

-- CreateIndex
CREATE INDEX "DiseaseSurveillanceCase_status_idx" ON "DiseaseSurveillanceCase"("status");

-- AddForeignKey
ALTER TABLE "CommunityOutreachVisit" ADD CONSTRAINT "CommunityOutreachVisit_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiseaseSurveillanceCase" ADD CONSTRAINT "DiseaseSurveillanceCase_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiseaseSurveillanceCase" ADD CONSTRAINT "DiseaseSurveillanceCase_reportedByUserId_fkey" FOREIGN KEY ("reportedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
