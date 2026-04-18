import { Request, Response } from 'express';

const BASE_URL = 'https://api.themoviedb.org/3/discover';

type TmdbMovieResponse = {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string;
  backdrop_path: string;
  genre_ids: Array<{ name: number }>;
  original_language: string;
};

type TmdbTVResponse = {
  id: number;
  name: string;
  overview: string;
  first_air_date: string;
  poster_path: string;
  status: string;
  genre_ids: Array<{ name: number }>;
  original_language: string;
  backdrop_path: string;
};

export const getPopularMovies = async (request: Request, response: Response) => {
  const language = request.query.language || request.params.language || 'en-US'; // Default to 'en-US' if not provided
  const page = request.query.page || request.params.page || '1'; // Default to '1' if not provided
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    response.status(500).json({ error: 'TMDB API key is missing' });
    return;
  }

  try {
    const result = await fetch(
      `${BASE_URL}/movie/?language=${language}&page=${page}&sort_by=popularity.desc&api_key=${apiKey}`
    );

    const data = (await result.json()) as Record<string, unknown>;

    if (!result.ok) {
      const errorData = data as { status_message?: string };
      response.status(result.status).json({ error: errorData.status_message || 'TMDB API error' });
      return;
    }

    const list = data.results as Array<Record<string, unknown>>;

    response.json(
      list.map((movie) => ({
        id: (movie as { id?: number }).id,
        title: (movie as { title?: string }).title,
        overview: (movie as { overview?: string }).overview,
        release_date: (movie as { release_date?: string }).release_date,
        genre_ids: (movie as { genre_ids?: number[] }).genre_ids ?? [],
        original_language: (movie as { original_language?: string }).original_language,
        backdrop_path: (movie as { backdrop_path?: string }).backdrop_path,
        poster_path: (movie as { poster_path?: string }).poster_path,
      }))
    );
  } catch (error) {
    response.status(500).json({ error: 'Failed to fetch featured content' });
  }
};

export const getPopularTVShows = async (request: Request, response: Response) => {
  const language = request.query.language || request.params.language || 'en-US'; // Default to 'en-US' if not provided
  const page = request.query.page || request.params.page || '1'; // Default to '1' if not provided
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    response.status(500).json({ error: 'TMDB API key is missing' });
    return;
  }

  try {
    const result = await fetch(
      `${BASE_URL}/tv/?language=${language}&page=${page}&sort_by=popularity.desc&api_key=${apiKey}`
    );

    const data = (await result.json()) as Record<string, unknown>;

    if (!result.ok) {
      const errorData = data as { status_message?: string };
      response.status(result.status).json({ error: errorData.status_message || 'TMDB API error' });
      return;
    }

    const list = data.results as Array<Record<string, unknown>>;

    response.json(
      list.map((tv) => ({
        id: (tv as { id?: number }).id,
        name: (tv as { name?: string }).name,
        overview: (tv as { overview?: string }).overview,
        first_air_date: (tv as { first_air_date?: string }).first_air_date,
        genre_ids: (tv as { genre_ids?: number[] }).genre_ids ?? [],
        original_language: (tv as { original_language?: string }).original_language,
        backdrop_path: (tv as { backdrop_path?: string }).backdrop_path,
        poster_path: (tv as { poster_path?: string }).poster_path,
      }))
    );
  } catch (error) {
    response.status(500).json({ error: 'Failed to fetch featured content' });
  }
};
