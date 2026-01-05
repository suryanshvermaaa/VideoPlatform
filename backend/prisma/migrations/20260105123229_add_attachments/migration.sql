-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "lectureId" TEXT,
    "title" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER,
    "storageProviderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Attachment_courseId_idx" ON "Attachment"("courseId");

-- CreateIndex
CREATE INDEX "Attachment_lectureId_idx" ON "Attachment"("lectureId");

-- CreateIndex
CREATE INDEX "Attachment_storageProviderId_idx" ON "Attachment"("storageProviderId");

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "Lecture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_storageProviderId_fkey" FOREIGN KEY ("storageProviderId") REFERENCES "StorageProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
