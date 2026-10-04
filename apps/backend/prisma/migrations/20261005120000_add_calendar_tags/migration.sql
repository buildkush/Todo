-- AlterTable
ALTER TABLE "Project" ADD COLUMN "availableTags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Todo" ADD COLUMN "customSections" JSONB;
ALTER TABLE "Todo" ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
