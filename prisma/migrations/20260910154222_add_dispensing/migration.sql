-- AlterTable
ALTER TABLE "InventoryTransaction" ADD COLUMN     "relatedPrescriptionItemId" TEXT;

-- AlterTable
ALTER TABLE "PrescriptionItem" ADD COLUMN     "dispensedAt" TIMESTAMP(3),
ADD COLUMN     "dispensedByUserId" TEXT,
ADD COLUMN     "dispensedFromBatchId" TEXT;

-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_dispensedFromBatchId_fkey" FOREIGN KEY ("dispensedFromBatchId") REFERENCES "MedicineBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_dispensedByUserId_fkey" FOREIGN KEY ("dispensedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_relatedPrescriptionItemId_fkey" FOREIGN KEY ("relatedPrescriptionItemId") REFERENCES "PrescriptionItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
