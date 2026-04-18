import { Router } from 'express';
import { requireEnvVar, requireMovieId, requireSeriesId } from '../middleware/validation';
import { getPopularMovies, getPopularTVShows } from '../controllers/popular';
import { getFeaturedMovies, getFeaturedTVShows } from '../controllers/featured';

const router = Router();

router.use(requireEnvVar('TMDB_API_KEY'));

// Popular content routes
// The "popular" endpoints use the TMDB "discover" endpoint to return content sorted by popularity,
// and can be relied upon for showcasing widely appealing content.
router.get('/api/movies/popular', getPopularMovies);
router.get('/api/tv/popular', getPopularTVShows);

// Featured content routes
// Note: The "featured" endpoints are currently implemented using the TMDB "trending" endpoints,
// which return content that is popular over a specified time frame (day or week).
// This is a temporary solution until we implement the user-based recommendation system.
router.get('/api/movies/featured', getFeaturedMovies);
router.get('/api/tv/featured', getFeaturedTVShows);

export { router as popularRouter };
export { router as featuredRouter };
