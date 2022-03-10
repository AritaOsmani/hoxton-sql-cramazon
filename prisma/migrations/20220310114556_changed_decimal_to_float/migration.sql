/*
  Warnings:

  - You are about to alter the column `price` on the `Items` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Float`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "price" REAL NOT NULL
);
INSERT INTO "new_Items" ("id", "image", "price", "title") SELECT "id", "image", "price", "title" FROM "Items";
DROP TABLE "Items";
ALTER TABLE "new_Items" RENAME TO "Items";
CREATE UNIQUE INDEX "Items_title_key" ON "Items"("title");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
