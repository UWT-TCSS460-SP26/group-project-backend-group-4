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

router.get('/ratings', getRatings);
router.get('/ratings/:id', getRatingById);
router.post('/ratings', requireAuth, createRating);
router.put('/ratings/:id', requireAuth, updateRating);
router.delete('/ratings/:id', requireAuth, deleteRating);

export { router as ratingsRouter };
