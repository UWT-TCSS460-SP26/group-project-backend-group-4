import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const ALLOWED_SORT_FIELDS = ['id', 'title', 'createdAt', 'updatedAt'];
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

type MediaType = 'movie' | 'tv';

const isValidMediaType = (value: unknown): value is MediaType => value === 'movie' || value === 'tv';
const isPrismaKnownRequestError = (error: unknown): error is { code: string } =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  typeof (error as { code: unknown }).code === 'string';

export const getReviews = async (request: Request, response: Response) => {
  const page = Math.max(1, Number(request.query.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(request.query.limit) || DEFAULT_LIMIT));
  const skip = (page - 1) * limit;

  const sort = ALLOWED_SORT_FIELDS.includes(String(request.query.sort))
    ? String(request.query.sort)
    : 'createdAt';
  const order = request.query.order === 'asc' ? 'asc' : 'desc';

  const tmdbIdRaw = request.query.tmdbId;
  const tmdbId = tmdbIdRaw !== undefined ? Number(tmdbIdRaw) : undefined;
  const userId = request.query.userId ? Number(request.query.userId) : undefined;
  const mediaType = request.query.mediaType;
  const q = typeof request.query.q === 'string' ? request.query.q.trim() : '';

  if (tmdbIdRaw === undefined) {
    response.status(400).json({ error: 'tmdbId query param is required' });
    return;
  }

  if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
    response.status(400).json({ error: 'tmdbId must be a positive integer' });
    return;
  }

  if (mediaType !== undefined && !isValidMediaType(mediaType)) {
    response.status(400).json({ error: 'Invalid mediaType. Expected "movie" or "tv"' });
    return;
  }

  const where = {
    tmdbId,
    ...(userId ? { userId } : {}),
    ...(mediaType ? { mediaType } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' as const } },
            { body: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  try {
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sort]: order },
        include: { user: { select: { id: true, username: true } } },
      }),
      prisma.review.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    response.json({
      data: reviews,
      pagination: { page, limit, total, totalPages },
    });
  } catch (_error) {
    response.status(500).json({ error: 'Failed to retrieve reviews' });
  }
};

export const getReviewById = async (request: Request, response: Response) => {
  const id = Number(request.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ error: 'Invalid review id' });
    return;
  }

  try {
    const review = await prisma.review.findUnique({
      where: { id },
      include: { user: { select: { id: true, username: true } } },
    });

    if (!review) {
      response.status(404).json({ error: 'Review not found' });
      return;
    }

    response.json({ data: review });
  } catch (_error) {
    response.status(500).json({ error: 'Failed to retrieve review' });
  }
};

export const createReview = async (request: Request, response: Response) => {
  const { tmdbId, mediaType, title, body } = request.body;
  const userId = request.user!.sub;

  if (!tmdbId || !Number.isInteger(Number(tmdbId))) {
    response.status(400).json({ error: 'tmdbId must be an integer' });
    return;
  }

  if (!isValidMediaType(mediaType)) {
    response.status(400).json({ error: 'Invalid mediaType. Expected "movie" or "tv"' });
    return;
  }

  if (typeof title !== 'string' || !title.trim()) {
    response.status(400).json({ error: 'title is required' });
    return;
  }

  if (typeof body !== 'string' || !body.trim()) {
    response.status(400).json({ error: 'body is required' });
    return;
  }

  try {
    const review = await prisma.review.create({
      data: {
        userId,
        tmdbId: Number(tmdbId),
        mediaType,
        title: title.trim(),
        body: body.trim(),
      },
      include: { user: { select: { id: true, username: true } } },
    });

    response.status(201).json({ data: review });
  } catch (error) {
    if (isPrismaKnownRequestError(error) && error.code === 'P2003') {
      response.status(400).json({ error: 'Author not found' });
      return;
    }
    response.status(500).json({ error: 'Failed to create review' });
  }
};

export const updateReview = async (request: Request, response: Response) => {
  const id = Number(request.params.id);
  const { tmdbId, mediaType, title, body } = request.body;
  const { sub: userId, role } = request.user!;

  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ error: 'Invalid review id' });
    return;
  }

  if (mediaType !== undefined && !isValidMediaType(mediaType)) {
    response.status(400).json({ error: 'Invalid mediaType. Expected "movie" or "tv"' });
    return;
  }

  try {
    const existing = await prisma.review.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existing) {
      response.status(404).json({ error: 'Review not found' });
      return;
    }
    if (role !== 'admin' && existing.userId !== userId) {
      response.status(403).json({ error: 'You can only update your own reviews' });
      return;
    }

    const review = await prisma.review.update({
      where: { id },
      data: {
        ...(tmdbId !== undefined ? { tmdbId: Number(tmdbId) } : {}),
        ...(mediaType !== undefined ? { mediaType } : {}),
        ...(title !== undefined ? { title: String(title).trim() } : {}),
        ...(body !== undefined ? { body: String(body).trim() } : {}),
      },
      include: { user: { select: { id: true, username: true } } },
    });

    response.json({ data: review });
  } catch (_error) {
    response.status(500).json({ error: 'Failed to update review' });
  }
};

export const deleteReview = async (request: Request, response: Response) => {
  const id = Number(request.params.id);
  const { sub: userId, role } = request.user!;

  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ error: 'Invalid review id' });
    return;
  }

  try {
    const existing = await prisma.review.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existing) {
      response.status(404).json({ error: 'Review not found' });
      return;
    }
    if (role !== 'admin' && existing.userId !== userId) {
      response.status(403).json({ error: 'You can only delete your own reviews' });
      return;
    }

    await prisma.review.delete({
      where: { id },
    });

    response.json({ data: { message: 'Review deleted successfully' } });
  } catch (_error) {
    response.status(500).json({ error: 'Failed to delete review' });
  }
};

