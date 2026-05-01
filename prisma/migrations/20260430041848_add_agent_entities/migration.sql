-- CreateTable
CREATE TABLE "Goal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "targetDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Insight" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sourceRefs" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Insight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlanDay" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "plannedWorkout" TEXT NOT NULL,
    "adjustedWorkout" TEXT,
    "adjustmentReason" TEXT,
    "insightId" INTEGER,
    CONSTRAINT "PlanDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlanDay_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "Insight" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NutritionLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "kcal" INTEGER NOT NULL,
    "proteinG" INTEGER NOT NULL,
    "notes" TEXT,
    CONSTRAINT "NutritionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HydrationLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "ml" INTEGER NOT NULL,
    CONSTRAINT "HydrationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CycleEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "phase" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    CONSTRAINT "CycleEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HabitNudge" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" DATETIME,
    CONSTRAINT "HabitNudge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanDay_userId_date_key" ON "PlanDay"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionLog_userId_date_key" ON "NutritionLog"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "HydrationLog_userId_date_key" ON "HydrationLog"("userId", "date");
