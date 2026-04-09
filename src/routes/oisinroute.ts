import { Router } from 'express';
import { oisinHello } from '../controllers/oisincontroller';

const oisinRouter = Router();

oisinRouter.get('/hello/oisin', oisinHello);

export { oisinRouter };
