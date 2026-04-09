import { Request, Response } from 'express';

export const oisinHello = (_request: Request, response: Response) => {
  response.json({ message: 'Oisin hello Oisin hello Oisin' });
};
