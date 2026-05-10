import { Router } from 'express';
import {
  requireEnvVar,
  validatePopularQuery,
  validateFeaturedSortQuery,
} from '../middleware/validation';
import { getPopularMovies, getPopularTVShows } from '../controllers/popular';
import { getFeaturedMovies, getFeaturedTVShows } from '../controllers/featured';

const router = Router();

router.use(requireEnvVar('TMDB_API_KEY'));

// Popular content routes
// The "popular" endpoints use the TMDB "discover" endpoint to return content sorted by popularity,
// and can be relied upon for showcasing widely appealing content.
router.get('/api/movies/popular', validatePopularQuery, getPopularMovies);
router.get('/api/tv/popular', validatePopularQuery, getPopularTVShows);

// Featured content routes
// The "featured" endpoints use local community data for ratings and reviews.
router.get('/api/movies/featured', validateFeaturedSortQuery, getFeaturedMovies);
router.get('/api/tv/featured', validateFeaturedSortQuery, getFeaturedTVShows);

export { router as popularRouter };
export { router as featuredRouter };
