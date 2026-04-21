/*
  Warnings:

  - You are about to drop the column `hashed_pw` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "hashed_pw";
