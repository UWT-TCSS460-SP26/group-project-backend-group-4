import { Request, Response } from 'express';
import { loggerUtil as logger } from '../utils/logger';

const BASE_URL = 'https://api.themoviedb.org/3/discover';

type TmdbMovieResponse = {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string;
  backdrop_path: string;
  genre_ids: number[];
  original_language: string;
};

type TmdbTVResponse = {
  id: number;
  name: string;
  overview: string;
  first_air_date: string;
  poster_path: string;
  status: string;
  genre_ids: number[];
  original_language: string;
  backdrop_path: string;
};

export const getPopularMovies = async (request: Request, response: Response) => {
  const language = (request.query.language as string) || 'en-US'; // Default to 'en-US' if not provided
  const page = (request.query.page as string) || '1'; // Default to '1' if not provided
  const querySortBy = (request.query.sort_by as string)?.toLowerCase();
  const sortOrder = querySortBy === 'asc' || querySortBy === 'popularity.asc' ? 'asc' : 'desc'; // Default to 'desc'
  const apiKey = process.env.TMDB_API_KEY;

  try {
    const result = await fetch(
      `${BASE_URL}/movie?language=${language}&page=${page}&sort_by=popularity.${sortOrder}&api_key=${apiKey}`
    );

    const data = (await result.json()) as Record<string, unknown>;

    if (!result.ok) {
      response.status(result.status).json({ message: data.status_message || 'TMDB API error' });
      return;
    }

    const list = data.results as TmdbMovieResponse[];

    response.json(
      list.map((movie) => ({
        id: movie.id,
        title: movie.title,
        overview: movie.overview,
        release_date: movie.release_date,
        genre_ids: movie.genre_ids ?? [],
        original_language: movie.original_language,
        backdrop_path: movie.backdrop_path,
        poster_path: movie.poster_path,
      }))
    );
  } catch (error) {
    logger.error('Error fetching popular movies:', error);
    response.status(502).json({ message: 'Failed to fetch popular content' });
  }
};

export const getPopularTVShows = async (request: Request, response: Response) => {
  const language = (request.query.language as string) || 'en-US'; // Default to 'en-US' if not provided
  const page = (request.query.page as string) || '1'; // Default to '1' if not provided
  const querySortBy = (request.query.sort_by as string)?.toLowerCase();
  const sortOrder = querySortBy === 'asc' || querySortBy === 'popularity.asc' ? 'asc' : 'desc'; // Default to 'desc'
  const apiKey = process.env.TMDB_API_KEY;

  try {
    const result = await fetch(
      `${BASE_URL}/tv?language=${language}&page=${page}&sort_by=popularity.${sortOrder}&api_key=${apiKey}`
    );

    const data = (await result.json()) as Record<string, unknown>;

    if (!result.ok) {
      response.status(result.status).json({ message: data.status_message || 'TMDB API error' });
      return;
    }

    const list = data.results as TmdbTVResponse[];

    response.json(
      list.map((tv) => ({
        id: tv.id,
        name: tv.name,
        overview: tv.overview,
        first_air_date: tv.first_air_date,
        genre_ids: tv.genre_ids ?? [],
        original_language: tv.original_language,
        backdrop_path: tv.backdrop_path,
        poster_path: tv.poster_path,
      }))
    );
  } catch (error) {
    logger.error('Error fetching popular TV shows:', error);
    response.status(502).json({ message: 'Failed to fetch popular content' });
  }
};
