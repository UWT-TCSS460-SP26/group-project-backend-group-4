import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { Prisma, MediaType } from '../generated/prisma/client';
import { resolveLocalUser } from '../auth/resolveLocalUser';
import { hasRoleAtLeast } from '../middleware/requireAuth';
import { loggerUtil as logger } from '../utils/logger';

// Create
export const createRating = async (req: Request, res: Response) => {
  const { tmdbId, type, score } = req.body;

  if (!Number.isInteger(tmdbId)) {
    return res.status(400).json({ message: 'Invalid tmdbId' });
  } else if (type !== 'MOVIE' && type !== 'TV_SHOW') {
    return res.status(400).json({ message: 'Invalid media type' });
  } else if (!Number.isInteger(score) || score < 1 || score > 5) {
    return res
      .status(400)
      .json({ message: 'Invalid rating score. Please provide a score between 1 and 5.' });
  }

  try {
    const author = await resolveLocalUser(req);

    // 1. Media Resolution: Find or create the media record
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

    // 2. Constraint Check: If the user has already rated, 409 conflict
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

    // 3. Creation (Wrapped in Transaction)
    const newRating = await prisma.$transaction(async (tx) => {
      const rating = await tx.rating.create({
        data: {
          userId: author.userId,
          mediaId: media.id,
          score,
        },
      });

      // 4. Aggregate Score Updates
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
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;

    const { userId, mediaId, tmdbId, type } = req.query;

    if ((tmdbId && !type) || (!tmdbId && type)) {
      return res.status(400).json({ message: 'Both tmdbId and type are required together' });
    }

    const where: Prisma.RatingWhereInput = {};

    if (userId) {
      where.userId = Number(userId);
    }

    if (mediaId) {
      where.mediaId = Number(mediaId);
    } else if (tmdbId && type) {
      if (type !== 'MOVIE' && type !== 'TV_SHOW') {
        return res.status(400).json({ message: 'Invalid media type' });
      }
      // Filter by the related Media's properties
      where.media = {
        tmdbId: Number(tmdbId),
        type: type as MediaType,
      };
    } else if (tmdbId || type) {
      return res.status(400).json({ message: 'Both tmdbId and type are required together.' });
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
  const { id } = req.params;

  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ message: 'Invalid rating ID' });
  }

  try {
    const rating = await prisma.rating.findUnique({
      where: { id: Number(id) },
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
  const { id } = req.params;
  const { score } = req.body;

  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ message: 'Invalid rating ID' });
  } else if (!Number.isInteger(score) || score < 1 || score > 5) {
    return res
      .status(400)
      .json({ message: 'Invalid rating score. Please provide a score between 1 and 5.' });
  }

  try {
    const author = await resolveLocalUser(req);

    // Find the rating first so we know which mediaId to update!
    const existingRating = await prisma.rating.findUnique({
      where: { id: Number(id) },
    });

    // Verify that the rating exists and that the user is authorized to update it
    if (!existingRating) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    const isOwner = existingRating?.userId === author.userId;
    const isPrivileged = hasRoleAtLeast(req.user?.role, 'Admin');
    if (!isOwner && !isPrivileged) {
      res.status(403).json({
        message: 'Unauthorized to update this rating',
      });
      return;
    }

    // Update the rating and aggregate the media score (Wrapped in Transaction)
    const updatedRating = await prisma.$transaction(async (tx) => {
      const rating = await tx.rating.update({
        where: { id: Number(id) },
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
  const { id } = req.params;

  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ message: 'Invalid rating ID' });
  }

  try {
    const author = await resolveLocalUser(req);

    // Find the rating first so we know which mediaId to update!
    const ratingToDelete = await prisma.rating.findUnique({
      where: { id: Number(id) },
    });

    if (!ratingToDelete) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    const isOwner = ratingToDelete?.userId === author.userId;
    const isPrivileged = hasRoleAtLeast(req.user?.role, 'Admin');
    if (!isOwner && !isPrivileged) {
      res.status(403).json({
        message: 'Unauthorized to delete this rating',
      });
      return;
    }

    // Delete the rating and aggregate the media score (Wrapped in Transaction)
    await prisma.$transaction(async (tx) => {
      await tx.rating.delete({
        where: { id: Number(id) },
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
