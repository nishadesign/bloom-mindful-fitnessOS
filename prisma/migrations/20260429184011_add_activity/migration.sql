-- CreateTable
CREATE TABLE "Activity" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sportType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "distanceMeters" REAL NOT NULL,
    "movingSeconds" INTEGER NOT NULL,
    "elapsedSeconds" INTEGER NOT NULL,
    "elevationGain" REAL NOT NULL,
    "avgHeartrate" REAL,
    "maxHeartrate" REAL,
    "avgSpeed" REAL,
    "calories" REAL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Activity_source_externalId_key" ON "Activity"("source", "externalId");
