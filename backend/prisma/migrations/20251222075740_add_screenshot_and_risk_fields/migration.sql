/*
  Warnings:

  - Added the required column `updatedAt` to the `Trade` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "entryPrice" REAL NOT NULL,
    "exitPrice" REAL,
    "quantity" REAL NOT NULL,
    "entryDate" DATETIME NOT NULL,
    "exitDate" DATETIME,
    "status" TEXT NOT NULL,
    "strategy" TEXT,
    "notes" TEXT,
    "tags" TEXT,
    "executionRate" INTEGER,
    "pnl" REAL,
    "screenshot" TEXT,
    "stopLoss" REAL,
    "takeProfit" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Trade" ("createdAt", "direction", "entryDate", "entryPrice", "executionRate", "exitDate", "exitPrice", "id", "notes", "pnl", "quantity", "screenshot", "status", "stopLoss", "strategy", "symbol", "tags", "takeProfit") SELECT "createdAt", "direction", "entryDate", "entryPrice", "executionRate", "exitDate", "exitPrice", "id", "notes", "pnl", "quantity", "screenshot", "status", "stopLoss", "strategy", "symbol", "tags", "takeProfit" FROM "Trade";
DROP TABLE "Trade";
ALTER TABLE "new_Trade" RENAME TO "Trade";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
