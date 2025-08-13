-- AlterTable
ALTER TABLE "public"."Reservation" ADD COLUMN     "roomId" INTEGER;

-- CreateTable
CREATE TABLE "public"."Room" (
    "id" SERIAL NOT NULL,
    "number" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BillingRecord" (
    "id" SERIAL NOT NULL,
    "reservationId" INTEGER NOT NULL,
    "roomCharges" DOUBLE PRECISION NOT NULL,
    "restaurant" DOUBLE PRECISION NOT NULL,
    "roomService" DOUBLE PRECISION NOT NULL,
    "laundry" DOUBLE PRECISION NOT NULL,
    "telephone" DOUBLE PRECISION NOT NULL,
    "club" DOUBLE PRECISION NOT NULL,
    "other" DOUBLE PRECISION NOT NULL,
    "lateCheckout" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Room_number_key" ON "public"."Room"("number");

-- CreateIndex
CREATE UNIQUE INDEX "BillingRecord_reservationId_key" ON "public"."BillingRecord"("reservationId");

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "public"."Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BillingRecord" ADD CONSTRAINT "BillingRecord_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "public"."Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
