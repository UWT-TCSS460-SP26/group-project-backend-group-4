import { Request, Response } from 'express';

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

export const searchTV = async (request: Request, response: Response) => {
  const series_id = request.params.series_id;
  const apiKey = process.env.TMDB_API_KEY;

  try {
    const result = await fetch(`${BASE_URL}/tv/${series_id}?api_key=${apiKey}`);

    const data = (await result.json()) as Record<string, unknown>;

    if (!result.ok) {
      response
        .status(result.status)
        .json({ error: data.message || 'The resource you requested could not be found' });
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
  } catch (_error) {
    response.status(502).json({ error: 'Failed to reach the TMDB API' });
  }
};

export const searchMovies = async (request: Request, response: Response) => {
  const movie_id = request.params.movie_id;
  const apiKey = process.env.TMDB_API_KEY;

  try {
    const result = await fetch(`${BASE_URL}/movie/${movie_id}?api_key=${apiKey}`);

    const data = (await result.json()) as Record<string, unknown>;

    if (!result.ok) {
      response
        .status(result.status)
        .json({ error: data.message || 'The resource you requested could not be found' });
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
  } catch (_error) {
    response.status(502).json({ error: 'Failed to reach the TMDB API' });
  }
};
