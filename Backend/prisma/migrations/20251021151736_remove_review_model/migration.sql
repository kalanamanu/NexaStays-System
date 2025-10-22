-- AlterTable
ALTER TABLE "public"."Hotel" ADD COLUMN     "checkInTime" TEXT,
ADD COLUMN     "checkOutTime" TEXT,
ADD COLUMN     "currency" TEXT DEFAULT 'USD',
ADD COLUMN     "email" TEXT,
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "neighborhood" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "policies" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "ratingCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "website" TEXT;

-- CreateTable
CREATE TABLE "public"."_HotelRelated" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_HotelRelated_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_HotelRelated_B_index" ON "public"."_HotelRelated"("B");

-- AddForeignKey
ALTER TABLE "public"."_HotelRelated" ADD CONSTRAINT "_HotelRelated_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_HotelRelated" ADD CONSTRAINT "_HotelRelated_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
