import { Router } from 'express';
import {
  requireEnvVar,
  requireMovieId,
  requireSeriesId,
  requireMovieName,
  requireSeriesName,
  validateSearchPagination,
} from '../middleware/validation';
import { queryMovies, queryTV, searchMovies, searchTV } from '../controllers/search';

const router = Router();

router.use(requireEnvVar('TMDB_API_KEY'));

// Static search paths must come before param-based routes, otherwise
// Express matches `/api/movie/search` as `/api/movie/:movie_id`.
router.get('/api/movies/search', requireMovieName, validateSearchPagination, queryMovies);
router.get('/api/tv/search', requireSeriesName, validateSearchPagination, queryTV);

router.get('/api/movie/:movie_id', requireMovieId, searchMovies);
router.get('/api/tv/:series_id', requireSeriesId, searchTV);

export { router as searchRouter };
