-- AlterTable
ALTER TABLE "Todo" ADD COLUMN     "parentTodoId" TEXT;

-- CreateIndex
CREATE INDEX "Todo_parentTodoId_order_deletedAt_idx" ON "Todo"("parentTodoId", "order", "deletedAt");

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_parentTodoId_fkey" FOREIGN KEY ("parentTodoId") REFERENCES "Todo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
