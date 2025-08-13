-- AlterTable
ALTER TABLE "public"."Reservation" ADD COLUMN     "durationCount" INTEGER,
ADD COLUMN     "durationType" TEXT,
ALTER COLUMN "departureDate" DROP NOT NULL;
