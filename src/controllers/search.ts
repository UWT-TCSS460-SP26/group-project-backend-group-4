import { Request, Response } from 'express';

const BASE_URL = 'https://api.themoviedb.org/3';

type TmdbMovieResponse = {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string;
  budget: number;
  genres: Array<{name: string}>;
};

type TmdbTVResponse = {
    id: number;
    name: string;
    overview: string;
    first_air_date: string;
    poster_path: string;
    status: string;
    genres: Array<{name: string}>;
};

export const searchTV = async (request: Request, response: Response) => {
    const series_id = request.query.series_id || request.params.series_id;
    const apiKey = process.env.TMDB_API_KEY;

    try {
        const result = await fetch(
            `${BASE_URL}/tv/${series_id}?api_key=${apiKey}`
        );
        
        const data = (await result.json()) as TmdbTVResponse;
        
        if (!result.ok) {
            response.status(result.status).json({ error: data.message || 'TMDB API error' });
            return;
        }

        const tv_details: TmdbTVResponse = {
            id: data.id,
            name: data.name,
            overview: data.overview,
            first_air_date: data.first_air_date,
            poster_path: data.poster_path,
            status: data.status,
            genres: data.genres
        }

        response.json(tv_details);
    } catch(_error) {
        response.status(502).json({ error: 'Failed to reach the TMDB API'});
    }
}

export const searchMovies = async (request: Request, response: Response) => {
    const movie_id = request.query.movie_id || request.params.movie_id;
    const apiKey = process.env.TMDB_API_KEY;

    try {
        const result = await fetch(
            `${BASE_URL}/movie/${movie_id}?api_key=${apiKey}`
        );

        const data = (await result.json()) as TmdbMovieResponse;

        if (!result.ok) {
            response.status(result.status).json({ error: data.message || 'TMDB API error' });
            return;
        }

        const movies_details: TmdbMovieResponse = {
            id: data.id,
            title: data.title,
            overview: data.overview,
            release_date: data.release_date,
            poster_path: data.poster_path,
            budget: data.budget,
            genres: data.genres
        }
        
        response.json(movies_details);
    } catch(_error) {
        response.status(502).json({ error: 'Failed to reach the TMDB API'});
    }
}
