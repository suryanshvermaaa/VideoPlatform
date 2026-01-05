-- AlterTable
ALTER TABLE "Lecture" ADD COLUMN     "storageProviderId" TEXT;

-- CreateTable
CREATE TABLE "StorageProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "endpoint" TEXT,
    "region" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "accessKeyId" TEXT NOT NULL,
    "secretEnc" TEXT NOT NULL,
    "forcePathStyle" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageProvider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StorageProvider_name_key" ON "StorageProvider"("name");

-- CreateIndex
CREATE INDEX "StorageProvider_active_idx" ON "StorageProvider"("active");

-- CreateIndex
CREATE INDEX "StorageProvider_isDefault_idx" ON "StorageProvider"("isDefault");

-- CreateIndex
CREATE INDEX "Lecture_storageProviderId_idx" ON "Lecture"("storageProviderId");

-- AddForeignKey
ALTER TABLE "Lecture" ADD CONSTRAINT "Lecture_storageProviderId_fkey" FOREIGN KEY ("storageProviderId") REFERENCES "StorageProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
