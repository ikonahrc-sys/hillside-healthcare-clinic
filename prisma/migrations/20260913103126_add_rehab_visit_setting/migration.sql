-- CreateEnum
CREATE TYPE "RehabVisitSetting" AS ENUM ('CLINIC', 'HOME_HEALTH_VISIT', 'MOBILE_CLINIC');

-- AlterTable
ALTER TABLE "TherapySession" ADD COLUMN     "setting" "RehabVisitSetting" NOT NULL DEFAULT 'CLINIC';
