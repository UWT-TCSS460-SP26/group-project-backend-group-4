import { Request, Response } from 'express';
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

export const getSeries = async (request: Request, response: Response) => {
  const series_id = request.params.series_id;
  const apiKey = process.env.TMDB_API_KEY;

  try {
    const result = await fetch(`${BASE_URL}/tv/${series_id}?api_key=${apiKey}`);

    const data = (await result.json()) as Record<string, unknown>;

    if (!result.ok) {
      response
        .status(result.status)
        .json({ message: data.message || 'The resource you requested could not be found' });
      return;
    }

    const tv_details: TmdbTVResponse = {
      id: data.id as number,
      name: data.name as string,
      overview: data.overview as string,
      first_air_date: data.first_air_date as string,
      poster_path: data.poster_path as string,
      status: data.status as string,
      genres: data.genres as Array<{ name: string }>,
    };

    response.json(tv_details);
  } catch (error) {
    logger.error('Error fetching TV details:', error);
    response.status(502).json({ message: 'Failed to reach the TMDB API' });
  }
};

export const getMovie = async (request: Request, response: Response) => {
  const movie_id = request.params.movie_id;
  const apiKey = process.env.TMDB_API_KEY;

  try {
    const result = await fetch(`${BASE_URL}/movie/${movie_id}?api_key=${apiKey}`);

    const data = (await result.json()) as Record<string, unknown>;

    if (!result.ok) {
      response
        .status(result.status)
        .json({ message: data.message || 'The resource you requested could not be found' });
      return;
    }

    const movies_details: TmdbMovieResponse = {
      id: data.id as number,
      title: data.title as string,
      overview: data.overview as string,
      release_date: data.release_date as string,
      poster_path: data.poster_path as string,
      budget: data.budget as number,
      genres: data.genres as Array<{ name: string }>,
    };

    response.json(movies_details);
  } catch (error) {
    logger.error('Error fetching movie details:', error);
    response.status(502).json({ message: 'Failed to reach the TMDB API' });
  }
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
