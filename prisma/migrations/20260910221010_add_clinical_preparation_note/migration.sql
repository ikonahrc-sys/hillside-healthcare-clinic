-- CreateTable
CREATE TABLE "ClinicalPreparationNote" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicalPreparationNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClinicalPreparationNote_studentId_idx" ON "ClinicalPreparationNote"("studentId");

-- CreateIndex
CREATE INDEX "ClinicalPreparationNote_patientId_idx" ON "ClinicalPreparationNote"("patientId");

-- AddForeignKey
ALTER TABLE "ClinicalPreparationNote" ADD CONSTRAINT "ClinicalPreparationNote_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalPreparationNote" ADD CONSTRAINT "ClinicalPreparationNote_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
