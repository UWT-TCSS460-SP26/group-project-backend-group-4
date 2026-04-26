import { Router } from 'express';
import {
  createRating,
  updateRating,
  getRatingById,
  getRatings,
  deleteRating,
} from '../controllers/ratings';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.get('/api/ratings', getRatings);
router.get('/api/ratings/:id', getRatingById);
router.post('/api/ratings', requireAuth, createRating);
router.put('/api/ratings/:id', requireAuth, updateRating);
router.delete('/api/ratings/:id', requireAuth, deleteRating);

export { router as ratingsRouter };
