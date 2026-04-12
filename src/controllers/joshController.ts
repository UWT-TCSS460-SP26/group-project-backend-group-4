import { Request, Response } from 'express';

export const joshHello = (_request: Request, response: Response) => {
  response.json({ message: 'Hello Hello Hello Hello from Joshua' });
};
