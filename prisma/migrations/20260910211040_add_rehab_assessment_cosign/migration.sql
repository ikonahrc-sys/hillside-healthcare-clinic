-- AlterTable
ALTER TABLE "RehabAssessment" ADD COLUMN     "coSignedAt" TIMESTAMP(3),
ADD COLUMN     "coSignedByUserId" TEXT;

-- AddForeignKey
ALTER TABLE "RehabAssessment" ADD CONSTRAINT "RehabAssessment_coSignedByUserId_fkey" FOREIGN KEY ("coSignedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
