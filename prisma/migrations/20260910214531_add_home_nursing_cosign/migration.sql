-- AlterTable
ALTER TABLE "HomeNursingAssessment" ADD COLUMN     "coSignedAt" TIMESTAMP(3),
ADD COLUMN     "coSignedByUserId" TEXT;

-- AlterTable
ALTER TABLE "HomeNursingCarePlan" ADD COLUMN     "coSignedAt" TIMESTAMP(3),
ADD COLUMN     "coSignedByUserId" TEXT;

-- AlterTable
ALTER TABLE "HomeVisit" ADD COLUMN     "coSignedAt" TIMESTAMP(3),
ADD COLUMN     "coSignedByUserId" TEXT;

-- AddForeignKey
ALTER TABLE "HomeNursingAssessment" ADD CONSTRAINT "HomeNursingAssessment_coSignedByUserId_fkey" FOREIGN KEY ("coSignedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeNursingCarePlan" ADD CONSTRAINT "HomeNursingCarePlan_coSignedByUserId_fkey" FOREIGN KEY ("coSignedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeVisit" ADD CONSTRAINT "HomeVisit_coSignedByUserId_fkey" FOREIGN KEY ("coSignedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
