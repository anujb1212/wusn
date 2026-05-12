/*
  Warnings:

  - You are about to drop the column `nodeId` on the `fields` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "fields" DROP CONSTRAINT "fields_nodeId_fkey";

-- DropIndex
DROP INDEX "fields_nodeId_idx";

-- DropIndex
DROP INDEX "fields_nodeId_key";

-- AlterTable
ALTER TABLE "Node" ADD COLUMN     "fieldId" INTEGER;

-- AlterTable
ALTER TABLE "fields" DROP COLUMN "nodeId";

-- CreateIndex
CREATE INDEX "Node_fieldId_idx" ON "Node"("fieldId");

-- AddForeignKey
ALTER TABLE "Node" ADD CONSTRAINT "Node_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE SET NULL ON UPDATE CASCADE;
