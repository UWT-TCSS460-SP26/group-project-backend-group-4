import { Request, Response } from 'express';
import { loggerUtil as logger } from '../utils/logger';
import { prisma } from '../lib/prisma';

const BASE_URL = 'https://api.themoviedb.org/3';

type TmdbMovieResponse = {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genres: Array<{ id: number; name: string }>;
  original_language: string;
};

type TmdbTVResponse = {
  id: number;
  name: string;
  overview: string;
  first_air_date: string;
  poster_path: string | null;
  status: string;
  genres: Array<{ id: number; name: string }>;
  original_language: string;
  backdrop_path: string | null;
};

type CommunityStats =
  | { rankingMetric: 'most-reviewed'; totalReviews: number }
  | { rankingMetric: 'top-rated'; avgScore: number | null; totalRatings: number };

type EnrichedMovie = {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids: number[];
  original_language: string;
  communityStats: CommunityStats;
};

type EnrichedTVShow = {
  id: number;
  name: string;
  overview: string;
  first_air_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids: number[];
  original_language: string;
  communityStats: CommunityStats;
};

const cache: {
  movies: {
    'most-reviewed': { data: EnrichedMovie[] | null; timestamp: number };
    'top-rated': { data: EnrichedMovie[] | null; timestamp: number };
  };
  tv: {
    'most-reviewed': { data: EnrichedTVShow[] | null; timestamp: number };
    'top-rated': { data: EnrichedTVShow[] | null; timestamp: number };
  };
} = {
  movies: {
    'most-reviewed': { data: null, timestamp: 0 },
    'top-rated': { data: null, timestamp: 0 },
  },
  tv: { 'most-reviewed': { data: null, timestamp: 0 }, 'top-rated': { data: null, timestamp: 0 } },
};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const getFeaturedMovies = async (request: Request, response: Response) => {
  try {
    const sort = (response.locals.sort || 'top-rated') as 'most-reviewed' | 'top-rated';
    const limit = 20;
    const apiKey = process.env.TMDB_API_KEY;

    // Return cached response if valid (disabled in testing environment)
    const cached = cache.movies[sort];
    if (
      process.env.NODE_ENV !== 'test' &&
      cached.data &&
      Date.now() - cached.timestamp < CACHE_TTL
    ) {
      return response.status(200).json(cached.data);
    }

    let movies;
    if (sort === 'most-reviewed') {
      movies = await prisma.media.findMany({
        where: { type: 'MOVIE', totalReviews: { gt: 0 } },
        orderBy: { totalReviews: 'desc' },
        take: limit,
      });
    } else {
      movies = await prisma.media.findMany({
        // Return only if greater than 2 results to avoid data skewing
        where: { type: 'MOVIE', totalRatings: { gte: 2 } },
        orderBy: { avgRating: 'desc' },
        take: limit,
      });
    }

    const enrichedMovies = await Promise.all(
      movies.map(async (movie) => {
        const stats: CommunityStats =
          sort === 'most-reviewed'
            ? { rankingMetric: 'most-reviewed', totalReviews: movie.totalReviews }
            : {
                rankingMetric: 'top-rated',
                avgScore: movie.avgRating,
                totalRatings: movie.totalRatings,
              };

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

    const finalResults = enrichedMovies.filter((movie): movie is EnrichedMovie => movie !== null);

    cache.movies[sort] = { data: finalResults, timestamp: Date.now() };

    return response.status(200).json(finalResults);
  } catch (error) {
    logger.error('Error retrieving featured movies:', error);
    return response.status(500).json({ message: 'Internal server error' });
  }
};

export const getFeaturedTVShows = async (request: Request, response: Response) => {
  try {
    const sort = (response.locals.sort || 'top-rated') as 'most-reviewed' | 'top-rated';
    const limit = 20;
    const apiKey = process.env.TMDB_API_KEY;

    // Return cached response if valid (disabled in testing environment)
    const cached = cache.tv[sort];
    if (
      process.env.NODE_ENV !== 'test' &&
      cached.data &&
      Date.now() - cached.timestamp < CACHE_TTL
    ) {
      return response.status(200).json(cached.data);
    }

    let tvShows;
    if (sort === 'most-reviewed') {
      tvShows = await prisma.media.findMany({
        where: { type: 'TV_SHOW', totalReviews: { gt: 0 } },
        orderBy: { totalReviews: 'desc' },
        take: limit,
      });
    } else {
      tvShows = await prisma.media.findMany({
        where: { type: 'TV_SHOW', totalRatings: { gte: 2 } },
        orderBy: { avgRating: 'desc' },
        take: limit,
      });
    }

    const enrichedTVShows = await Promise.all(
      tvShows.map(async (tvShow) => {
        const stats: CommunityStats =
          sort === 'most-reviewed'
            ? { rankingMetric: 'most-reviewed', totalReviews: tvShow.totalReviews }
            : {
                rankingMetric: 'top-rated',
                avgScore: tvShow.avgRating,
                totalRatings: tvShow.totalRatings,
              };

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

    const finalResults = enrichedTVShows.filter((show): show is EnrichedTVShow => show !== null);

    cache.tv[sort] = { data: finalResults, timestamp: Date.now() };

    return response.status(200).json(finalResults);
  } catch (error) {
    logger.error('Error retrieving featured TV shows:', error);
    return response.status(500).json({ message: 'Internal server error' });
  }
};
