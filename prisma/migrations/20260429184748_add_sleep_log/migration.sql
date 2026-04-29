-- CreateTable
CREATE TABLE "SleepLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "totalMinutes" INTEGER NOT NULL,
    "deepMinutes" INTEGER NOT NULL,
    "remMinutes" INTEGER NOT NULL,
    "lightMinutes" INTEGER NOT NULL,
    "awakeMinutes" INTEGER NOT NULL,
    "hrvMs" REAL,
    "restingHr" REAL,
    "readinessScore" INTEGER,
    "sleepScore" INTEGER,
    "bodyTempDelta" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SleepLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SleepLog_userId_source_date_key" ON "SleepLog"("userId", "source", "date");
