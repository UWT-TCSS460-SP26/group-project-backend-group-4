import { Request, Response } from 'express';
import { loggerUtil as logger } from '../utils/logger';
import { prisma } from '../lib/prisma';

const BASE_URL = 'https://api.themoviedb.org/3';

type TmdbMovieResponse = {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string;
  backdrop_path: string;
  genres: Array<{ id: number; name: string }>;
  original_language: string;
};

type TmdbTVResponse = {
  id: number;
  name: string;
  overview: string;
  first_air_date: string;
  poster_path: string;
  status: string;
  genres: Array<{ id: number; name: string }>;
  original_language: string;
  backdrop_path: string;
};

type CommunityStats =
  | { rankingMetric: 'most-reviewed'; totalReviews: number }
  | { rankingMetric: 'top-rated'; avgScore: number | null; totalRatings: number };

export const getFeaturedMovies = async (request: Request, response: Response) => {
  try {
    const sort = request.query.sort === 'most-reviewed' ? 'most-reviewed' : 'top-rated';
    const limit = 20;
    const apiKey = process.env.TMDB_API_KEY;

    const movieMedia = await prisma.media.findMany({
      where: { type: 'MOVIE' },
      select: { id: true },
    });
    const movieMediaIds = movieMedia.map((media) => media.id);

    let mediaIds: number[] = [];
    const communityStatsMap = new Map<number, CommunityStats>();

    if (sort === 'most-reviewed') {
      const agg = await prisma.review.groupBy({
        by: ['mediaId'],
        where: { mediaId: { in: movieMediaIds } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: limit,
      });
      mediaIds = agg.map((item) => item.mediaId);
      agg.forEach((item) =>
        communityStatsMap.set(item.mediaId, {
          rankingMetric: 'most-reviewed',
          totalReviews: item._count.id,
        })
      );
    } else {
      const agg = await prisma.rating.groupBy({
        by: ['mediaId'],
        where: { mediaId: { in: movieMediaIds } },
        _avg: { score: true },
        _count: { score: true },
        having: { score: { _count: { gte: 2 } } },
        orderBy: { _avg: { score: 'desc' } },
        take: limit,
      });
      mediaIds = agg.map((item) => item.mediaId);
      agg.forEach((item) =>
        communityStatsMap.set(item.mediaId, {
          rankingMetric: 'top-rated',
          avgScore: item._avg.score,
          totalRatings: item._count.score,
        })
      );
    }

    const movies = await prisma.media.findMany({
      where: { id: { in: mediaIds } },
    });
    const movieMap = new Map(movies.map((m) => [m.id, m]));

    const enrichedMovies = await Promise.all(
      // Map over mediaIds to strictly preserve the sorted order from the aggregation
      mediaIds.map(async (id) => {
        const movie = movieMap.get(id);
        const stats = communityStatsMap.get(id);
        if (!movie) return null;

        try {
          const tmdbRes = await fetch(`${BASE_URL}/movie/${movie.tmdbId}?api_key=${apiKey}`);
          if (!tmdbRes.ok) return null;
          const tmdbData = (await tmdbRes.json()) as TmdbMovieResponse;

          return {
            id: tmdbData.id,
            title: tmdbData.title,
            overview: tmdbData.overview,
            release_date: tmdbData.release_date,
            poster_path: tmdbData.poster_path,
            backdrop_path: tmdbData.backdrop_path,
            genre_ids: tmdbData.genres ? tmdbData.genres.map((g) => g.id) : [],
            original_language: tmdbData.original_language,
            communityStats: stats,
          };
        } catch (error) {
          logger.error(`Error fetching TMDB data for movie ${movie.tmdbId}:`, error);
          return null;
        }
      })
    );

    const finalResults = enrichedMovies.filter(Boolean);
    response.status(200).json(finalResults);
  } catch (error) {
    logger.error('Error retrieving featured movies:', error);
    response.status(500).json({ message: 'Internal server error' });
  }
};

export const getFeaturedTVShows = async (request: Request, response: Response) => {
  try {
    const sort = request.query.sort === 'most-reviewed' ? 'most-reviewed' : 'top-rated';
    const limit = 20;
    const apiKey = process.env.TMDB_API_KEY;

    const tvMedia = await prisma.media.findMany({
      where: { type: 'TV_SHOW' },
      select: { id: true },
    });
    const tvMediaIds = tvMedia.map((media) => media.id);

    let mediaIds: number[] = [];
    const communityStatsMap = new Map<number, CommunityStats>();

    if (sort === 'most-reviewed') {
      const agg = await prisma.review.groupBy({
        by: ['mediaId'],
        where: { mediaId: { in: tvMediaIds } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: limit,
      });
      mediaIds = agg.map((item) => item.mediaId);
      agg.forEach((item) =>
        communityStatsMap.set(item.mediaId, {
          rankingMetric: 'most-reviewed',
          totalReviews: item._count.id,
        })
      );
    } else {
      const agg = await prisma.rating.groupBy({
        by: ['mediaId'],
        where: { mediaId: { in: tvMediaIds } },
        _avg: { score: true },
        _count: { score: true },
        having: { score: { _count: { gte: 2 } } },
        orderBy: { _avg: { score: 'desc' } },
        take: limit,
      });
      mediaIds = agg.map((item) => item.mediaId);
      agg.forEach((item) =>
        communityStatsMap.set(item.mediaId, {
          rankingMetric: 'top-rated',
          avgScore: item._avg.score,
          totalRatings: item._count.score,
        })
      );
    }

    const tvShows = await prisma.media.findMany({
      where: { id: { in: mediaIds } },
    });
    const tvShowMap = new Map(tvShows.map((m) => [m.id, m]));

    const enrichedTVShows = await Promise.all(
      mediaIds.map(async (id) => {
        const tvShow = tvShowMap.get(id);
        const stats = communityStatsMap.get(id);
        if (!tvShow) return null;

        try {
          const tmdbRes = await fetch(`${BASE_URL}/tv/${tvShow.tmdbId}?api_key=${apiKey}`);
          if (!tmdbRes.ok) return null;
          const tmdbData = (await tmdbRes.json()) as TmdbTVResponse;

          return {
            id: tmdbData.id,
            name: tmdbData.name,
            overview: tmdbData.overview,
            first_air_date: tmdbData.first_air_date,
            poster_path: tmdbData.poster_path,
            backdrop_path: tmdbData.backdrop_path,
            genre_ids: tmdbData.genres ? tmdbData.genres.map((g) => g.id) : [],
            original_language: tmdbData.original_language,
            communityStats: stats,
          };
        } catch (error) {
          logger.error(`Error fetching TMDB data for TV show ${tvShow.tmdbId}:`, error);
          return null;
        }
      })
    );

    const finalResults = enrichedTVShows.filter(Boolean);
    return response.status(200).json(finalResults);
  } catch (error) {
    logger.error('Error retrieving featured TV shows:', error);
    response.status(500).json({ message: 'Internal server error' });
  }
};
