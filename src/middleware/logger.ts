import { Request, Response, NextFunction } from 'express';
import { loggerUtil } from '../utils/logger';

export const logger = (request: Request, _response: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  loggerUtil.log(`[${timestamp}] ${request.method} ${request.path}`);
  next();
};
