import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { Prisma } from '../generated/prisma/client';
import { resolveLocalUser } from '../auth/resolveLocalUser';
import { loggerUtil as logger } from '../utils/logger';

// Create
export const createRating = async (req: Request, res: Response) => {
  const { tmdbId, type, score } = req.body;

  try {
    const author = await resolveLocalUser(req);

    let media = await prisma.media.findUnique({
      where: { tmdbId_type: { tmdbId, type } },
    });

    if (!media) {
      media = await prisma.media.create({
        data: {
          tmdbId,
          type,
          avgRating: 0,
          totalRatings: 0,
        },
      });
    }

    const existingRating = await prisma.rating.findUnique({
      where: {
        userId_mediaId: {
          userId: author.userId,
          mediaId: media.id,
        },
      },
    });

    if (existingRating) {
      return res.status(409).json({ message: 'User has already rated this media.' });
    }

    const newRating = await prisma.$transaction(async (tx) => {
      const rating = await tx.rating.create({
        data: {
          userId: author.userId,
          mediaId: media.id,
          score,
        },
      });

      const aggregations = await tx.rating.aggregate({
        where: { mediaId: media.id },
        _avg: { score: true },
        _count: { score: true },
      });

      await tx.media.update({
        where: { id: media.id },
        data: {
          avgRating: aggregations._avg.score || 0,
          totalRatings: aggregations._count.score,
        },
      });

      return rating;
    });

    res.status(201).json(newRating);
  } catch (error) {
    logger.error('Error creating rating:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all ratings
export const getRatings = async (req: Request, res: Response) => {
  try {
    const { page, limit, userId, mediaId, tmdbId, type } = res.locals;
    const skip = (page - 1) * limit;

    const where: Prisma.RatingWhereInput = {};

    if (userId !== undefined) {
      where.userId = userId;
    }

    if (mediaId !== undefined) {
      where.mediaId = mediaId;
    } else if (tmdbId !== undefined && type !== undefined) {
      where.media = { tmdbId, type };
    }

    const [ratings, total] = await Promise.all([
      prisma.rating.findMany({
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
      }),
      prisma.rating.count({ where }),
    ]);

    res.json({
      data: ratings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error fetching ratings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get by id
export const getRatingById = async (req: Request, res: Response) => {
  const id = res.locals.id;

  try {
    const rating = await prisma.rating.findUnique({
      where: { id },
      include: {
        user: {
          select: { username: true },
        },
      },
    });
    if (!rating) {
      return res.status(404).json({ message: 'Rating not found' });
    }
    res.json(rating);
  } catch (error) {
    logger.error('Error fetching rating:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update
export const updateRating = async (req: Request, res: Response) => {
  const id = res.locals.id;
  const { score } = req.body;

  try {
    const user = await resolveLocalUser(req);

    const existingRating = await prisma.rating.findUnique({
      where: { id },
    });

    if (!existingRating) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    if (existingRating?.userId !== user.userId) {
      res.status(403).json({
        message: 'Unauthorized to update this rating',
      });
      return;
    }

    const updatedRating = await prisma.$transaction(async (tx) => {
      const rating = await tx.rating.update({
        where: { id },
        data: { score },
      });

      const aggregations = await tx.rating.aggregate({
        where: { mediaId: rating.mediaId },
        _avg: { score: true },
        _count: { score: true },
      });

      await tx.media.update({
        where: { id: rating.mediaId },
        data: {
          avgRating: aggregations._avg.score || 0,
          totalRatings: aggregations._count.score,
        },
      });

      return rating;
    });

    res.json(updatedRating);
  } catch (error) {
    logger.error('Error updating rating:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete
export const deleteRating = async (req: Request, res: Response) => {
  const id = res.locals.id;

  try {
    const user = await resolveLocalUser(req);

    const ratingToDelete = await prisma.rating.findUnique({
      where: { id },
    });

    if (!ratingToDelete) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    if (ratingToDelete?.userId !== user.userId) {
      res.status(403).json({
        message: 'Unauthorized to delete this rating',
      });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.rating.delete({
        where: { id },
      });

      const aggregations = await tx.rating.aggregate({
        where: { mediaId: ratingToDelete.mediaId },
        _avg: { score: true },
        _count: { score: true },
      });

      await tx.media.update({
        where: { id: ratingToDelete.mediaId },
        data: {
          avgRating: aggregations._avg.score || 0,
          totalRatings: aggregations._count.score,
        },
      });
    });

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting rating:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
