import { Router } from 'express';
import {
  requireEnvVar,
  requireMovieId,
  requireSeriesId,
  requireTitleName,
  validateSearchPagination,
} from '../middleware/validation';
import { searchMovies, searchShows, getMovie, getSeries } from '../controllers/search';

const router = Router();

router.use(requireEnvVar('TMDB_API_KEY'));

// Static search paths must come before param-based routes, otherwise
// Express matches `/api/movie/search` as `/api/movie/:movie_id`.
router.get('/api/movies/search', requireTitleName, validateSearchPagination, searchMovies);
router.get('/api/tv/search', requireTitleName, validateSearchPagination, searchShows);

router.get('/api/movie/:movie_id', requireMovieId, getMovie);
router.get('/api/tv/:series_id', requireSeriesId, getSeries);

export { router as searchRouter };
