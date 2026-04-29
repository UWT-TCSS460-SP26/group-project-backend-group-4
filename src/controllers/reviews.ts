import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { Prisma, MediaType } from '../generated/prisma/client';
import { parseIdOrRespond, getUserIdOrRespond } from '../middleware/validation';

// ====== Validation & Parsing Helpers ========
const isValidReviewType = (type: unknown): type is MediaType =>
  type === 'MOVIE' || type === 'TV_SHOW';

const parsePositiveInt = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

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
  const userId =
    typeof res.locals.userId === 'number' ? res.locals.userId : getUserIdOrRespond(req, res);
  if (!userId) {
    return;
  }

  if (!Number.isInteger(tmdbId)) {
    return res.status(400).json({ message: 'Invalid tmdbId' });
  }
  if (!isValidReviewType(type)) {
    return res.status(400).json({ message: 'Invalid media type' });
  }
  if (typeof body !== 'string' || !body.trim()) {
    return res.status(400).json({ message: 'Review body is required.' });
  }
  if (title !== undefined && typeof title !== 'string') {
    return res.status(400).json({ message: 'Invalid review title.' });
  }

  try {
    const media = await resolveOrCreateMedia(tmdbId, type);

    const existingReview = await prisma.review.findUnique({
      where: {
        userId_mediaId: {
          userId,
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
          userId,
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
    console.error('Error creating review:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ======= Reviews: Get All =======
export const getReviews = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;

    const { userId, mediaId, tmdbId, type } = req.query;
    const where: Prisma.ReviewWhereInput = {};

    if (userId) {
      const parsedUserId = parsePositiveInt(userId);
      if (!parsedUserId) {
        return res.status(400).json({ message: 'Invalid userId' });
      }
      where.userId = parsedUserId;
    }

    if (mediaId) {
      const parsedMediaId = parsePositiveInt(mediaId);
      if (!parsedMediaId) {
        return res.status(400).json({ message: 'Invalid mediaId' });
      }
      where.mediaId = parsedMediaId;
    } else if (tmdbId && type) {
      const parsedTmdbId = parsePositiveInt(tmdbId);
      if (!parsedTmdbId) {
        return res.status(400).json({ message: 'Invalid tmdbId' });
      }
      if (!isValidReviewType(type)) {
        return res.status(400).json({ message: 'Invalid media type' });
      }
      where.media = {
        tmdbId: parsedTmdbId,
        type,
      };
    } else if (tmdbId || type) {
      return res.status(400).json({ message: 'Both tmdbId and type are required together' });
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
    console.error('Error fetching reviews:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ======== Reviews: Get By ID =======
export const getReviewById = async (req: Request, res: Response) => {
  const id =
    typeof res.locals.id === 'number'
      ? res.locals.id
      : parseIdOrRespond(req.params.id, res, 'Invalid review id');
  if (!id) {
    return;
  }

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
    console.error('Error fetching review:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ==== Reviews: Update ======
export const updateReview = async (req: Request, res: Response) => {
  const id =
    typeof res.locals.id === 'number'
      ? res.locals.id
      : parseIdOrRespond(req.params.id, res, 'Invalid review id');
  const { title, body } = req.body;
  if (!id) {
    return;
  }

  const userId =
    typeof res.locals.userId === 'number' ? res.locals.userId : getUserIdOrRespond(req, res);
  if (!userId) {
    return;
  }

  if (title !== undefined && typeof title !== 'string') {
    return res.status(400).json({ message: 'Invalid review title.' });
  }
  if (body !== undefined && (typeof body !== 'string' || !body.trim())) {
    return res.status(400).json({ message: 'Invalid review body.' });
  }
  if (title === undefined && body === undefined) {
    return res.status(400).json({ message: 'No fields provided to update.' });
  }

  try {
    const existingReview = await prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      return res.status(404).json({ message: 'Review not found' });
    } else if (existingReview.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized to update this review' });
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
    console.error('Error updating review:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ====== Reviews: Delete ======
export const deleteReview = async (req: Request, res: Response) => {
  const id =
    typeof res.locals.id === 'number'
      ? res.locals.id
      : parseIdOrRespond(req.params.id, res, 'Invalid review id');
  if (!id) {
    return;
  }

  const userId =
    typeof res.locals.userId === 'number' ? res.locals.userId : getUserIdOrRespond(req, res);
  const role = req.user?.role;

  if (!userId) {
    return;
  }

  try {
    const reviewToDelete = await prisma.review.findUnique({
      where: { id },
    });

    if (!reviewToDelete) {
      return res.status(404).json({ message: 'Review not found' });
    } else if (reviewToDelete.userId !== userId && role !== 'ADMIN' && role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to delete this review' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.review.delete({
        where: { id },
      });

      await updateMediaReviewCount(tx, reviewToDelete.mediaId);
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting review:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
