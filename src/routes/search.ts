import { Router } from 'express';
import { requireEnvVar, requireMovieId, requireSeriesId } from '../middleware/validation';
import { searchMovies, searchTV } from '../controllers/search';

const router = Router();

router.use(requireEnvVar('TMDB_API_KEY'));

router.get('/api/movie/:movie_id', requireMovieId, searchMovies);
router.get('/api/tv/:series_id', requireSeriesId, searchTV);

export { router as searchRouter };
