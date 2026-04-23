/*
  Warnings:

  - You are about to drop the `Media` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ratings" DROP CONSTRAINT "ratings_mediaId_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_mediaId_fkey";

-- DropTable
DROP TABLE "Media";

-- CreateTable
CREATE TABLE "media" (
    "id" SERIAL NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "type" "MediaType" NOT NULL,
    "avgRating" DOUBLE PRECISION NOT NULL,
    "totalRatings" INTEGER NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "media_tmdbId_key" ON "media"("tmdbId");

-- CreateIndex
CREATE INDEX "media_tmdbId_idx" ON "media"("tmdbId");

-- CreateIndex
CREATE UNIQUE INDEX "media_tmdbId_type_key" ON "media"("tmdbId", "type");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
