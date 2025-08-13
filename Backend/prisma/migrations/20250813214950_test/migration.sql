/*
  Warnings:

  - You are about to drop the column `durationCount` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `durationType` on the `Reservation` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Reservation" DROP CONSTRAINT "Reservation_customerId_fkey";

-- AlterTable
ALTER TABLE "public"."Reservation" DROP COLUMN "durationCount",
DROP COLUMN "durationType",
ADD COLUMN     "guestEmail" TEXT,
ADD COLUMN     "guestName" TEXT,
ADD COLUMN     "guestPhone" TEXT,
ADD COLUMN     "roomNumber" TEXT,
ALTER COLUMN "customerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."CustomerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
