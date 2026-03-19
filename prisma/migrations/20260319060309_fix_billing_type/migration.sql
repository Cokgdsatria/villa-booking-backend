/*
  Warnings:

  - You are about to drop the column `email` on the `Owner` table. All the data in the column will be lost.
  - Changed the type of `billingType` on the `Inquiry` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "BillingType" AS ENUM ('MONTHLY', 'YEARLY');

-- 2. Mapping data lama
UPDATE "Inquiry"
SET "billingType" =
  CASE
    WHEN "billingType" ILIKE 'monthly' THEN 'MONTHLY'
    WHEN "billingType" ILIKE 'yearly' THEN 'YEARLY'
    ELSE 'MONTHLY'
  END;

-- 3. Ubah tipe kolom
ALTER TABLE "Inquiry"
ALTER COLUMN "billingType" TYPE "BillingType"
USING "billingType"::"BillingType";

-- DropIndex
DROP INDEX "Owner_email_key";

-- AlterTable
ALTER TABLE "Owner" DROP COLUMN "email";

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "totalPrice" INTEGER NOT NULL,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Booking_propertyId_idx" ON "Booking"("propertyId");

-- CreateIndex
CREATE INDEX "Review_propertyId_idx" ON "Review"("propertyId");

-- CreateIndex
CREATE INDEX "Inquiry_propertyId_idx" ON "Inquiry"("propertyId");

-- CreateIndex
CREATE INDEX "Property_ownerId_idx" ON "Property"("ownerId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
