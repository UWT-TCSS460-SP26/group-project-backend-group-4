import { Router } from "express";
import { Request, Response } from 'express';

const router = Router();

router.get('/heartbeat', (_request: Request, response: Response) => {
    response.json({ status: 'healthy' });
});


export { router as statusRouter };