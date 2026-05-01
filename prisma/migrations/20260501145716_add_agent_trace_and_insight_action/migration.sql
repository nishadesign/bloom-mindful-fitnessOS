-- CreateTable
CREATE TABLE "AgentTrace" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "insightId" INTEGER,
    "skillName" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "ok" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "latencyMs" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentTrace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AgentTrace_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "Insight" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Insight" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sourceRefs" TEXT NOT NULL,
    "action" TEXT NOT NULL DEFAULT 'pending',
    "actedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Insight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Insight" ("body", "createdAt", "id", "sourceRefs", "title", "type", "userId") SELECT "body", "createdAt", "id", "sourceRefs", "title", "type", "userId" FROM "Insight";
DROP TABLE "Insight";
ALTER TABLE "new_Insight" RENAME TO "Insight";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AgentTrace_userId_createdAt_idx" ON "AgentTrace"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AgentTrace_skillName_createdAt_idx" ON "AgentTrace"("skillName", "createdAt");
