import { Request, Response } from 'express';
import { MediaType } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';
import { Prisma } from '../generated/prisma/client';
import { loggerUtil as logger } from '../utils/logger';

const BASE_URL = 'https://api.themoviedb.org/3';

type TmdbMovieResponse = {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string;
  budget: number;
  genres: Array<{ name: string }>;
  message?: string;
};

type TmdbTVResponse = {
  id: number;
  name: string;
  overview: string;
  first_air_date: string;
  poster_path: string;
  status: string;
  genres: Array<{ name: string }>;
  message?: string;
};

type TmdbMovieSearchResult = {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
};

type TmdbTVSearchResult = {
  id: number;
  name: string;
  first_air_date: string;
  poster_path: string | null;
};

type MediaWithReviews = Prisma.MediaGetPayload<{
  include: {
    reviews: {
      include: {
        user: { select: { username: true } };
      };
    };
  };
}>;

export const getSeries = async (request: Request, response: Response) => {
  const series_id = request.params.series_id;
  const apiKey = process.env.TMDB_API_KEY;

  let tv_details: TmdbTVResponse;
  try {
    const result = await fetch(`${BASE_URL}/tv/${series_id}?api_key=${apiKey}`);

    const data = (await result.json()) as Record<string, unknown>;

    if (!result.ok) {
      response
        .status(result.status)
        .json({ message: data.message || 'The resource you requested could not be found' });
      return;
    }

    tv_details = {
      id: data.id as number,
      name: data.name as string,
      overview: data.overview as string,
      first_air_date: data.first_air_date as string,
      poster_path: data.poster_path as string,
      status: data.status as string,
      genres: data.genres as Array<{ name: string }>,
    };
  } catch (error) {
    logger.error('Error fetching TV details:', error);
    response.status(502).json({ error: 'Failed to reach the TMDB API' });
    return;
  }

  let media: MediaWithReviews | null = null;
  try {
    //Our DB data
    media = await prisma.media.findUnique({
      where: {
        tmdbId_type: {
          tmdbId: Number(series_id),
          type: MediaType.TV_SHOW,
        },
      },
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            user: { select: {username: true} },
          },
        },
      },
    });
  } catch (_error) {
    response.status(503).json({ error: 'Failed to reach the database' });
  }

  response.json({
      ...tv_details, // <-- TMDB metadata, \/ DB data
      community: media
        ? {
          avgRating: media.avgRating,
          totalRatings: media.totalRatings,
          totalReviews: media.totalReviews,
          recentReviews: media.reviews.map((r: { id: number; title: string | null; body: string; createdAt: Date; user: { username: string } }) => ({
            id: r.id,
            title: r.title,
            body: r.body,
            author: r.user.username,
            createdAt: r.createdAt,
          })),
        }
        : {
          avgRating: null,
          totalRatings: 0,
          totalReviews: 0,
          recentReviews: [],
        },
    });
};

export const getMovie = async (request: Request, response: Response) => {
  const movie_id = request.params.movie_id;
  const apiKey = process.env.TMDB_API_KEY;

  let movies_details: TmdbMovieResponse;
  try {
    const result = await fetch(`${BASE_URL}/movie/${movie_id}?api_key=${apiKey}`);

    const data = (await result.json()) as Record<string, unknown>;

    if (!result.ok) {
      response
        .status(result.status)
        .json({ message: data.message || 'The resource you requested could not be found' });
      return;
    }

    movies_details = {
      id: data.id as number,
      title: data.title as string,
      overview: data.overview as string,
      release_date: data.release_date as string,
      poster_path: data.poster_path as string,
      budget: data.budget as number,
      genres: data.genres as Array<{ name: string }>,
    };
  } catch (error) {
    logger.error('Error fetching movie details:', error);
    response.status(502).json({ error: 'Failed to reach the TMDB API' });
    return;
  }

  let media: MediaWithReviews | null = null;
  try {
    //Our DB data
    media = await prisma.media.findUnique({
      where: {
        tmdbId_type: {
          tmdbId: Number(movie_id),
          type: MediaType.MOVIE,
        },
      },
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            user: { select: {username: true} },
          },
        },
      },
    });
  } catch (_error) {
    response.status(503).json({ error: 'Failed to reach the database' });
    return;
  }

  response.json( { 
      ...movies_details, // <-- TMDB metadata, \/ DB data
      community: media
        ? {
          avgRating: media.avgRating,
          totalRatings: media.totalRatings,
          totalReviews: media.totalReviews,
          recentReviews: media.reviews.map((r: { id: number; title: string | null; body: string; createdAt: Date; user: { username: string } }) => ({
            id: r.id,
            title: r.title,
            body: r.body,
            author: r.user.username,
            createdAt: r.createdAt,
          })),
        }
        : {
          avgRating: null,
          totalRatings: 0,
          totalReviews: 0,
          recentReviews: [],
        },
    });
};

export const searchMovies = async (request: Request, response: Response) => {
  const query = request.query.title as string;
  const page = request.query.page ? Number(request.query.page) : 1;
  const limit = request.query.limit ? Number(request.query.limit) : 20;
  const apiKey = process.env.TMDB_API_KEY;

  try {
    const result = await fetch(
      `${BASE_URL}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=${page}`
    );
    const data = (await result.json()) as Record<string, unknown>;

    if (!result.ok) {
      response
        .status(result.status)
        .json({ message: data.message || 'The resource you requested could not be found' });
      return;
    }

    const results = (Array.isArray(data.results) ? (data.results as TmdbMovieSearchResult[]) : [])
      .map((item) => ({
        id: item.id,
        title: item.title,
        release_date: item.release_date,
        poster_path: item.poster_path,
      }))
      .slice(0, limit);

    response.json({
      page,
      results,
    });
  } catch (error) {
    logger.error('Error fetching movie details:', error);
    response.status(502).json({ message: 'Failed to reach the TMDB API' });
  }
};

export const searchShows = async (request: Request, response: Response) => {
  const query = request.query.title as string;
  const page = request.query.page ? Number(request.query.page) : 1;
  const limit = request.query.limit ? Number(request.query.limit) : 20;
  const apiKey = process.env.TMDB_API_KEY;

  try {
    const result = await fetch(
      `${BASE_URL}/search/tv?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=${page}`
    );
    const data = (await result.json()) as Record<string, unknown>;

    if (!result.ok) {
      response
        .status(result.status)
        .json({ message: data.message || 'The resource you requested could not be found' });
      return;
    }

    const results = (Array.isArray(data.results) ? (data.results as TmdbTVSearchResult[]) : [])
      .map((item) => ({
        id: item.id,
        title: item.name,
        release_date: item.first_air_date,
        poster_path: item.poster_path,
      }))
      .slice(0, limit);

    response.json({
      page,
      results,
    });
  } catch (error) {
    logger.error('Error fetching TV details:', error);
    response.status(502).json({ message: 'Failed to reach the TMDB API' });
  }
};
