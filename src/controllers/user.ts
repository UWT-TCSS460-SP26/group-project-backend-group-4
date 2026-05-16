import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { loggerUtil as logger } from '../utils/logger';

export const getMyProfile = async (req: Request, res: Response) => {
  const subjectId = req.user?.sub;

  try {
    const user = await prisma.user.findUnique({ where: { subjectId } });
    if (!user) return res.status(401).json({ message: 'User not found' });

    return res.json({ user });
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
