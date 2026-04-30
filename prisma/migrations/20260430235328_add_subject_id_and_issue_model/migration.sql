/*
  Warnings:

  - A unique constraint covering the columns `[subjectId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `subjectId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('open', 'in_progress', 'resolved', 'wont_fix');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "subjectId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Issue" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "status" "IssueStatus" NOT NULL DEFAULT 'open',
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_subjectId_key" ON "users"("subjectId");
