/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Tasks` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `Tasks` table. All the data in the column will be lost.
  - You are about to drop the column `reminder` on the `Tasks` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Tasks` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Tasks` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Tasks" DROP COLUMN "createdAt",
DROP COLUMN "priority",
DROP COLUMN "reminder",
DROP COLUMN "status",
DROP COLUMN "updatedAt",
ALTER COLUMN "deadline" DROP NOT NULL,
ALTER COLUMN "deadline" SET DATA TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
