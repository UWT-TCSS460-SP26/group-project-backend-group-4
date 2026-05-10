import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { loggerUtil as logger } from '../utils/logger';

const BASE_URL = 'https://api.themoviedb.org/3';

//~~~~~~~~~~~~~~~~ DA TYPES ~~~~~~~~~~~~~~

type RatingEntry = {
  id: number;
  score: number;
  createdAt: Date;
  media: {
    tmdbId: number;
    type: string;
    title: string | null;
  };
};

type ReviewEntry = {
  id: number;
  title: string | null;
  body: string;
  createdAt: Date;
  media: {
    tmdbId: number;
    type: string;
    title: string | null;
  };
};

// ~~~~~~~~~~~~~~~~~DA HELPERS~~~~~~~~~~

// Helper - Gets titles from TMDB
async function fetchTmdbTitle(
  tmdbId: number,
  type: 'MOVIE' | 'TV_SHOW',
  apiKey: string
): Promise<string | null> {
  try {
    const endpoint =
      type === 'MOVIE'
        ? `${BASE_URL}/movie/${tmdbId}?api_key=${apiKey}`
        : `${BASE_URL}/tv/${tmdbId}?api_key=${apiKey}`;

    const result = await fetch(endpoint);
    if (!result.ok) {
      logger.warn(`TMDB returned ${result.status} for ${type} ${tmdbId}`);
      return null;
    }

    const data = (await result.json()) as Record<string, unknown>;
    return type === 'MOVIE' ? ((data.title as string) ?? null) : ((data.name as string) ?? null);
  } catch (error) {
    logger.error(`Failed to fetch TMDB title for ${type} ${tmdbId}:`, error);
    return null;
  }
}

// Helper - Builds a deduped title map for a list of media entries
async function buildTitleMap(
  entries: { media: { tmdbId: number; type: 'MOVIE' | 'TV_SHOW' } }[],
  apiKey: string
): Promise<Map<string, string | null>> {
  const uniqueMedia = new Map<string, { tmdbId: number; type: 'MOVIE' | 'TV_SHOW' }>();
  for (const entry of entries) {
    const key = `${entry.media.tmdbId}:${entry.media.type}`;
    if (!uniqueMedia.has(key)) {
      uniqueMedia.set(key, entry.media);
    }
  }

  const titleMap = new Map<string, string | null>();
  const results = await Promise.allSettled(
    Array.from(uniqueMedia.entries()).map(async ([key, { tmdbId, type }]) => {
      const title = await fetchTmdbTitle(tmdbId, type, apiKey);
      return { key, title: title ?? 'Unknown Title' }; // null-safe: falls back if TMDB returns nothing
    })
  );

  // Whether or not the everything in the Promise.allSettled is settled
  for (const result of results) {
    if (result.status === 'fulfilled') {
      titleMap.set(result.value.key, result.value.title);
    } else {
      logger.error('Failed to resolve a TMDB title:', result.reason);
    }
  }

  return titleMap;
}

// Helper - Maps raw rating rows to RatingEntry shape
function mapRatings(
  ratings: {
    id: number;
    score: number;
    createdAt: Date;
    user: { userId: number; username: string | null };
    media: { tmdbId: number; type: 'MOVIE' | 'TV_SHOW' };
  }[],
  titleMap: Map<string, string | null>
): RatingEntry[] {
  return ratings.map((r) => ({
    ...r,
    media: {
      ...r.media,
      title: titleMap.get(`${r.media.tmdbId}:${r.media.type}`) ?? null,
    },
  }));
}

// Helper - Maps raw review rows to ReviewEntry shape
function mapReviews(
  reviews: {
    id: number;
    title: string | null;
    body: string;
    createdAt: Date;
    user: { userId: number; username: string | null };
    media: { tmdbId: number; type: 'MOVIE' | 'TV_SHOW' };
  }[],
  titleMap: Map<string, string | null>
): ReviewEntry[] {
  return reviews.map((r) => ({
    ...r,
    media: {
      ...r.media,
      title: titleMap.get(`${r.media.tmdbId}:${r.media.type}`) ?? null,
    },
  }));
}

// Helper - Parses pagination query params
function parsePagination(req: Request): { page: number; limit: number; skip: number } {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  return { page, limit, skip: (page - 1) * limit };
}

// ~~~~~~~~~~~~~~~~~ DA CONTROLLERS ~~~~~~~~~~~~~~

export const getUserReviews = async (req: Request, res: Response) => {
  const { limit, skip } = parsePagination(req);
  const apiKey = process.env.TMDB_API_KEY!;
  const subjectId = req.user?.sub;

  try {
    const user = await prisma.user.findUnique({ where: { subjectId } });
    if (!user) return res.status(401).json({ message: 'User not found, Unauthenticated error' });

    const reviews = await prisma.review.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        body: true,
        createdAt: true,
        user: { select: { userId: true, username: true } },
        media: { select: { tmdbId: true, type: true } },
      },
    });

    const titleMap = await buildTitleMap(reviews, apiKey);
    return res.json({ reviews: mapReviews(reviews, titleMap) });
  } catch (error) {
    logger.error('Error fetching user reviews:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserRatings = async (req: Request, res: Response) => {
  const { limit, skip } = parsePagination(req);
  const apiKey = process.env.TMDB_API_KEY!;
  const subjectId = req.user?.sub;

  try {
    const user = await prisma.user.findUnique({ where: { subjectId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const ratings = await prisma.rating.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        score: true,
        createdAt: true,
        user: { select: { userId: true, username: true } },
        media: { select: { tmdbId: true, type: true } },
      },
    });

    const titleMap = await buildTitleMap(ratings, apiKey);
    return res.json({ ratings: mapRatings(ratings, titleMap) });
  } catch (error) {
    logger.error('Error fetching user ratings:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserRatingsReviews = async (req: Request, res: Response) => {
  const { limit, skip } = parsePagination(req);
  const apiKey = process.env.TMDB_API_KEY!;
  const subjectId = req.user?.sub;

  try {
    const user = await prisma.user.findUnique({ where: { subjectId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const [ratings, reviews] = await prisma.$transaction([
      prisma.rating.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          score: true,
          createdAt: true,
          user: { select: { userId: true, username: true } },
          media: { select: { tmdbId: true, type: true } },
        },
      }),
      prisma.review.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          body: true,
          createdAt: true,
          user: { select: { userId: true, username: true } },
          media: { select: { tmdbId: true, type: true } },
        },
      }),
    ]);

    const titleMap = await buildTitleMap([...ratings, ...reviews], apiKey);
    return res.json({
      ratings: mapRatings(ratings, titleMap),
      reviews: mapReviews(reviews, titleMap),
    });
  } catch (error) {
    logger.error('Error fetching user ratings/reviews:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
