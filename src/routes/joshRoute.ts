import { Router } from 'express';
import { joshHello } from '../controllers/joshController';

const joshRouter = Router();

joshRouter.get('/hello/josh', joshHello);

export { joshRouter };
