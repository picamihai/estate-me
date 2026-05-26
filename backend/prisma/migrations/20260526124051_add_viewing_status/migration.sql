-- CreateEnum
CREATE TYPE "ViewingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- AlterTable
ALTER TABLE "Viewing" ADD COLUMN     "requestedById" TEXT,
ADD COLUMN     "requestedByUsername" TEXT,
ADD COLUMN     "status" "ViewingStatus" NOT NULL DEFAULT 'PENDING';
