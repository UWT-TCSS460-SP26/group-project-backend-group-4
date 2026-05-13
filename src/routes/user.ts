import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { getMyProfile } from '../controllers/user';

const router = Router();

router.get('/api/users/me', requireAuth, getMyProfile);

export { router as userRouter };
