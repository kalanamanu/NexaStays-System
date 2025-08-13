-- CreateTable
CREATE TABLE "public"."BlockBooking" (
    "id" SERIAL NOT NULL,
    "travelCompanyId" INTEGER NOT NULL,
    "rooms" INTEGER NOT NULL,
    "roomType" TEXT NOT NULL,
    "arrivalDate" TIMESTAMP(3) NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "discountRate" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockBooking_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."BlockBooking" ADD CONSTRAINT "BlockBooking_travelCompanyId_fkey" FOREIGN KEY ("travelCompanyId") REFERENCES "public"."TravelCompanyProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
