import { Router } from 'express';
import {
  requireEnvVar,
  requireMovieId,
  requireSeriesId,
  requireTitleName,
  validateSearchPagination,
} from '../middleware/validation';
import { searchMovies, searchShows, getMovie, getSeries } from '../controllers/search';

const searchRouter = Router();

searchRouter.use(requireEnvVar('TMDB_API_KEY'));

// Static search paths must come before param-based routes, otherwise
// Express matches `/api/movie/search` as `/api/movie/:movie_id`.
searchRouter.get('/api/movies/search', requireTitleName, validateSearchPagination, searchMovies);
searchRouter.get('/api/tv/search', requireTitleName, validateSearchPagination, searchShows);

searchRouter.get('/api/movies/:movie_id', requireMovieId, getMovie);
searchRouter.get('/api/tv/:series_id', requireSeriesId, getSeries);

export { searchRouter };
