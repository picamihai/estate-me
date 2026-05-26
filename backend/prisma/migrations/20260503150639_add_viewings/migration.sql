-- CreateTable
CREATE TABLE "Viewing" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,

    CONSTRAINT "Viewing_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Viewing" ADD CONSTRAINT "Viewing_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
