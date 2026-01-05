-- AlterTable
ALTER TABLE "Lecture" ADD COLUMN     "notesAttachmentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Lecture_notesAttachmentId_key" ON "Lecture"("notesAttachmentId");

-- AddForeignKey
ALTER TABLE "Lecture" ADD CONSTRAINT "Lecture_notesAttachmentId_fkey" FOREIGN KEY ("notesAttachmentId") REFERENCES "Attachment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
