import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { Prisma, MediaType } from '../generated/prisma/client';
import { resolveLocalUser } from '../auth/resolveLocalUser';
import { hasRoleAtLeast } from '../middleware/requireAuth';
import { loggerUtil as logger } from '../utils/logger';

// ====== Validation & Parsing Helpers ========
const normalizeTitle = (title: unknown): string | null => {
  if (typeof title !== 'string') {
    return null;
  }
  const trimmed = title.trim();
  return trimmed || null;
};

// ======= Media Resolution Helpers =======
const resolveOrCreateMedia = async (tmdbId: number, type: MediaType) => {
  const existingMedia = await prisma.media.findUnique({
    where: { tmdbId_type: { tmdbId, type } },
  });

  if (existingMedia) {
    return existingMedia;
  }

  return prisma.media.create({
    data: {
      tmdbId,
      type,
      avgRating: 0,
      totalRatings: 0,
      totalReviews: 0,
    },
  });
};

// ====== Aggregate Update Helpers =======
const updateMediaReviewCount = async (tx: Prisma.TransactionClient, mediaId: number) => {
  const aggregations = await tx.review.aggregate({
    where: { mediaId },
    _count: { id: true },
  });

  await tx.media.update({
    where: { id: mediaId },
    data: {
      totalReviews: aggregations._count.id,
    },
  });
};

//======= Reviews: Create =====
export const createReview = async (req: Request, res: Response) => {
  const { tmdbId, type, title, body } = req.body;

  try {
    const author = await resolveLocalUser(req);
    const media = await resolveOrCreateMedia(tmdbId, type);

    const existingReview = await prisma.review.findUnique({
      where: {
        userId_mediaId: {
          userId: author.userId,
          mediaId: media.id,
        },
      },
    });

    if (existingReview) {
      return res.status(409).json({ message: 'User has already reviewed this media.' });
    }

    const newReview = await prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          userId: author.userId,
          mediaId: media.id,
          title: normalizeTitle(title),
          body: body.trim(),
        },
      });

      await updateMediaReviewCount(tx, media.id);
      return review;
    });

    return res.status(201).json(newReview);
  } catch (error) {
    logger.error('Error creating review:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ======= Reviews: Get All =======
export const getReviews = async (req: Request, res: Response) => {
  try {
    const { page, limit, userId, mediaId, tmdbId, type } = res.locals;
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = {};

    if (userId !== undefined) {
      where.userId = userId;
    }

    if (mediaId !== undefined) {
      where.mediaId = mediaId;
    } else if (tmdbId !== undefined && type !== undefined) {
      where.media = { tmdbId, type };
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: { username: true },
          },
          media: {
            select: { tmdbId: true, type: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.count({ where }),
    ]);

    return res.json({
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching reviews:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ======== Reviews: Get By ID =======
export const getReviewById = async (req: Request, res: Response) => {
  const id = res.locals.id;

  try {
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: { username: true },
        },
        media: {
          select: { tmdbId: true, type: true },
        },
      },
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    return res.json(review);
  } catch (error) {
    logger.error('Error fetching review:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ==== Reviews: Update ======
export const updateReview = async (req: Request, res: Response) => {
  const id = res.locals.id;
  const { title, body } = req.body;

  try {
    const user = await resolveLocalUser(req);
    const existingReview = await prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (existingReview?.userId !== user.userId) {
      res.status(403).json({
        message: 'Unauthorized to update this review',
      });
      return;
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: normalizeTitle(title) } : {}),
        ...(body !== undefined ? { body: body.trim() } : {}),
      },
    });

    return res.json(updatedReview);
  } catch (error) {
    logger.error('Error updating review:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ====== Reviews: Delete ======
export const deleteReview = async (req: Request, res: Response) => {
  const id = res.locals.id;

  try {
    const author = await resolveLocalUser(req);
    const reviewToDelete = await prisma.review.findUnique({
      where: { id },
    });

    if (!reviewToDelete) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const isOwner = reviewToDelete?.userId === author.userId;
    const isPrivileged = hasRoleAtLeast(req.user?.role, 'Admin');
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({
        message: 'Unauthorized to delete this review',
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.review.delete({
        where: { id },
      });

      await updateMediaReviewCount(tx, reviewToDelete.mediaId);
    });

    return res.status(204).send();
  } catch (error) {
    logger.error('Error deleting review:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
