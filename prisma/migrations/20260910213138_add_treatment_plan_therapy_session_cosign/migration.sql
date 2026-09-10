-- AlterTable
ALTER TABLE "RehabTreatmentPlan" ADD COLUMN     "coSignedAt" TIMESTAMP(3),
ADD COLUMN     "coSignedByUserId" TEXT;

-- AlterTable
ALTER TABLE "TherapySession" ADD COLUMN     "coSignedAt" TIMESTAMP(3),
ADD COLUMN     "coSignedByUserId" TEXT;

-- AddForeignKey
ALTER TABLE "RehabTreatmentPlan" ADD CONSTRAINT "RehabTreatmentPlan_coSignedByUserId_fkey" FOREIGN KEY ("coSignedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TherapySession" ADD CONSTRAINT "TherapySession_coSignedByUserId_fkey" FOREIGN KEY ("coSignedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
