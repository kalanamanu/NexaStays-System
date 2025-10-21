/*
  Warnings:

  - A unique constraint covering the columns `[hotelId,number]` on the table `Room` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Room_number_key";

-- AlterTable
ALTER TABLE "public"."Reservation" ADD COLUMN     "hotelId" INTEGER;

-- AlterTable
ALTER TABLE "public"."Room" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "hotelId" INTEGER;

-- CreateTable
CREATE TABLE "public"."Hotel" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "starRating" DOUBLE PRECISION,
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "travelCompanyId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hotel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Hotel_slug_key" ON "public"."Hotel"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Room_hotelId_number_key" ON "public"."Room"("hotelId", "number");

-- AddForeignKey
ALTER TABLE "public"."Hotel" ADD CONSTRAINT "Hotel_travelCompanyId_fkey" FOREIGN KEY ("travelCompanyId") REFERENCES "public"."TravelCompanyProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Room" ADD CONSTRAINT "Room_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "public"."Hotel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "public"."Hotel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
