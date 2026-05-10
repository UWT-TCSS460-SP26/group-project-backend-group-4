import { Router } from 'express';
import {
  createRating,
  updateRating,
  getRatingById,
  getRatings,
  deleteRating,
} from '../controllers/ratings';
import { requireAuth } from '../middleware/requireAuth';
import {
  validateIdParam,
  validateGetReviewsQuery,
  validateCreateRatingBody,
  validateUpdateRatingBody,
  requireEnvVar,
} from '../middleware/validation';
import { getUserRatings } from '../controllers/me';

const router = Router();

router.get('/api/ratings', validateGetReviewsQuery, getRatings);
router.get('/api/ratings/:id', validateIdParam, getRatingById);
router.post('/api/ratings', requireAuth, validateCreateRatingBody, createRating);
router.put(
  '/api/ratings/:id',
  requireAuth,
  validateIdParam,
  validateUpdateRatingBody,
  updateRating
);
router.delete('/api/ratings/:id', requireAuth, validateIdParam, deleteRating);
router.get('/api/ratings/me/enhanced', requireAuth, requireEnvVar('TMDB_API_KEY'), getUserRatings);

export { router as ratingsRouter };
