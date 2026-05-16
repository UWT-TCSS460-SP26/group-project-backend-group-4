import { Router } from 'express';
import {
  requireEnvVar,
  validatePopularQuery,
  validateFeaturedSortQuery,
} from '../middleware/validation';
import { getPopularMovies, getPopularTVShows } from '../controllers/popular';
import { getFeaturedMovies, getFeaturedTVShows } from '../controllers/featured';

const popularRouter = Router();
const featuredRouter = Router();

popularRouter.use(requireEnvVar('TMDB_API_KEY'));
featuredRouter.use(requireEnvVar('TMDB_API_KEY'));

// Popular content routes
// The "popular" endpoints use the TMDB "discover" endpoint to return content sorted by popularity,
// and can be relied upon for showcasing widely appealing content.
popularRouter.get('/api/movies/popular', validatePopularQuery, getPopularMovies);
popularRouter.get('/api/tv/popular', validatePopularQuery, getPopularTVShows);

// Featured content routes
// The "featured" endpoints use local community data for ratings and reviews.
featuredRouter.get('/api/movies/featured', validateFeaturedSortQuery, getFeaturedMovies);
featuredRouter.get('/api/tv/featured', validateFeaturedSortQuery, getFeaturedTVShows);

export { popularRouter };
export { featuredRouter };
