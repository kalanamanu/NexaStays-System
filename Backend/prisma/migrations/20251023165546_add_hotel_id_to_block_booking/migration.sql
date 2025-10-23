-- AlterTable
ALTER TABLE "public"."BlockBooking" ADD COLUMN     "hotelId" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."BlockBooking" ADD CONSTRAINT "BlockBooking_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "public"."Hotel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
