import { Router } from 'express';
import { requireEnvVar, requireMovieId, requireSeriesId } from '../middleware/validation';
import { getMovie, getSeries } from '../controllers/search';

const router = Router();

router.use(requireEnvVar('TMDB_API_KEY'));

router.get('/api/movies/:movie_id', requireMovieId, getMovie);
router.get('/api/tv/:series_id', requireSeriesId, getSeries);

export { router as searchRouter };
