/*
  Warnings:

  - You are about to drop the column `roomNumber` on the `Reservation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Reservation" DROP COLUMN "roomNumber",
ADD COLUMN     "durationCount" INTEGER,
ADD COLUMN     "durationType" TEXT;
