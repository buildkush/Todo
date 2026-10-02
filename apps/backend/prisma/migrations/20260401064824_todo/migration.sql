-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT,
    "theme" TEXT DEFAULT 'light',
    "language" TEXT DEFAULT 'en-US',
    "defaultProjectView" TEXT DEFAULT 'list',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "viewType" TEXT NOT NULL,
    "status" TEXT DEFAULT 'active',
    "color" TEXT,
    "icon" TEXT,
    "defaultSortOrder" TEXT DEFAULT 'manual',
    "showCompletedTodos" BOOLEAN NOT NULL DEFAULT true,
    "allowDragDropBetweenSections" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Todo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "sectionId" TEXT,
    "boardSectionId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3),
    "priority" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Todo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "isCollapsed" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardSection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "color" TEXT,
    "wip" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "BoardSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "Project_userId_deletedAt_idx" ON "Project"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "Project_createdAt_idx" ON "Project"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "Todo_userId_deletedAt_idx" ON "Todo"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "Todo_projectId_sectionId_order_deletedAt_idx" ON "Todo"("projectId", "sectionId", "order", "deletedAt");

-- CreateIndex
CREATE INDEX "Todo_projectId_boardSectionId_order_deletedAt_idx" ON "Todo"("projectId", "boardSectionId", "order", "deletedAt");

-- CreateIndex
CREATE INDEX "Todo_isCompleted_userId_deletedAt_idx" ON "Todo"("isCompleted", "userId", "deletedAt");

-- CreateIndex
CREATE INDEX "Section_projectId_order_deletedAt_idx" ON "Section"("projectId", "order", "deletedAt");

-- CreateIndex
CREATE INDEX "Section_userId_deletedAt_idx" ON "Section"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "BoardSection_projectId_order_deletedAt_idx" ON "BoardSection"("projectId", "order", "deletedAt");

-- CreateIndex
CREATE INDEX "BoardSection_userId_deletedAt_idx" ON "BoardSection"("userId", "deletedAt");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_boardSectionId_fkey" FOREIGN KEY ("boardSectionId") REFERENCES "BoardSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardSection" ADD CONSTRAINT "BoardSection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardSection" ADD CONSTRAINT "BoardSection_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
