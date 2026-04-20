import { Request, Response, NextFunction } from 'express';

export const logger = (request: Request, _response: Response, next: NextFunction) => {
  if (process.env.NODE_ENV !== 'test') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${request.method} ${request.path}`);
  }
  next();
};
