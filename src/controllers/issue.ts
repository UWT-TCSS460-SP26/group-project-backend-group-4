import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export async function getIssue(req: Request, res: Response) {
  const { id } = req.params;

  // if we arnt getting a specific id, then just give the most recent 10
  if (id === undefined) {
    try {
      const issues = await prisma.issue.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        where: {
          deleted: false,
        },
        omit: {
          deleted: true,
        },
      });
      res.status(200).json({ issues });
    } catch (error) {
      console.error(`Error getting issues: ${error}`);
      res.status(500).json({ message: 'Internal Server Error' });
      return;
    }
  } else {
    try {
      const issue = await prisma.issue.findUnique({
        where: {
          // we know that this will be here as the endpoint `/issues/:id` is gated behind the validateIdParam validation middleware
          id: res.locals.id,
          deleted: false,
        },
        omit: {
          deleted: true,
        },
      });
      if (issue === null) {
        res.status(404).json({ message: 'Issue not found' });
        return;
      }
      res.status(200).json({ issue });
    } catch (error) {
      console.error(`Error getting issues: ${error}`);
      res.status(500).json({ message: 'Internal Server Error' });
      return;
    }
  }
}

export async function createIssue(req: Request, res: Response) {
  const { title, body, contact } = req.body;
  try {
    const issue = await prisma.issue.create({
      data: {
        title,
        body,
        contact,
      },
      omit: {
        deleted: true,
      },
    });
    res.status(201).json({ message: 'Issue created', issue });
  } catch (error) {
    console.error(`Error creating issue: ${error}`);

    res.status(500).json({ message: 'Internal Server Error' });
    return;
  }
}

export async function updateIssue(req: Request, res: Response) {
  const issueId = res.locals.id as number;
  const { title, body, contact, status } = req.body;
  try {
    const issue = await prisma.issue.findUnique({
      where: {
        id: issueId,
      },
    });

    if (issue === null) {
      res.status(404).json({ message: 'Issue not found' });
      return;
    }

    const newIssue = await prisma.issue.update({
      omit: {
        deleted: true,
      },
      where: {
        id: issueId,
      },
      data: {
        title,
        body,
        contact,
        status,
      },
    });
    res.status(200).json({ message: 'Issue updated', newIssue });
  } catch (error) {
    console.error(`Error updating issue: ${error}`);

    res.status(500).json({ message: 'Internal Server Error' });
    return;
  }
}
