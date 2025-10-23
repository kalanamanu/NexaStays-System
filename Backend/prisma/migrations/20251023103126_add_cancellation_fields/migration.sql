-- AlterTable
ALTER TABLE "public"."Reservation" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "customerNotified" BOOLEAN NOT NULL DEFAULT false;
