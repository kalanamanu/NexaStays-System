/*
  Warnings:

  - You are about to drop the column `durationCount` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `durationType` on the `Reservation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Reservation" DROP COLUMN "durationCount",
DROP COLUMN "durationType",
ADD COLUMN     "roomNumber" TEXT;
