/*
  Warnings:

  - You are about to drop the column `roomType` on the `BlockBooking` table. All the data in the column will be lost.
  - You are about to drop the column `rooms` on the `BlockBooking` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."BlockBooking" DROP COLUMN "roomType",
DROP COLUMN "rooms";

-- CreateTable
CREATE TABLE "public"."BlockBookingRoomType" (
    "id" SERIAL NOT NULL,
    "blockBookingId" INTEGER NOT NULL,
    "roomType" TEXT NOT NULL,
    "rooms" INTEGER NOT NULL,

    CONSTRAINT "BlockBookingRoomType_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."BlockBookingRoomType" ADD CONSTRAINT "BlockBookingRoomType_blockBookingId_fkey" FOREIGN KEY ("blockBookingId") REFERENCES "public"."BlockBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
