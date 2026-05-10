import { Request, Response } from 'express';
import { Prisma } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';
import { loggerUtil as logger } from '../utils/logger';

/**
 * GET /issues — Admin-gated list with pagination, filtering, and sorting.
 * Query params (validated by validateGetIssuesQuery middleware):
 *   page      — 1-based page number (default 1)
 *   limit     — items per page (default 20, max 100)
 *   status    — filter by one or more IssueStatus values
 *   sortBy    — createdAt | status | title (default createdAt)
 *   sortOrder — asc | desc (default desc)
 */
export async function listIssues(req: Request, res: Response) {
  const { page, limit, status, sortBy, sortOrder } = res.locals as {
    page: number;
    limit: number;
    status?: string[];
    sortBy: 'createdAt' | 'status' | 'title';
    sortOrder: 'asc' | 'desc';
  };

  const where: Prisma.IssueWhereInput = { deleted: false };
  if (status && status.length > 0) {
    where.status = { in: status as Prisma.EnumIssueStatusFilter['in'] };
  }

  const orderBy: Prisma.IssueOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  };

  try {
    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        omit: { deleted: true },
      }),
      prisma.issue.count({ where }),
    ]);

    res.status(200).json({
      issues,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error listing issues:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}

/**
 * GET /issues/:id — Admin-gated detail for a single issue.
 */
export async function getIssue(req: Request, res: Response) {
  const issueId = res.locals.id as number;

  try {
    const issue = await prisma.issue.findUnique({
      where: { id: issueId, deleted: false },
      omit: { deleted: true },
    });

    if (issue === null) {
      res.status(404).json({ message: 'Issue not found' });
      return;
    }

    res.status(200).json({ issue });
  } catch (error) {
    logger.error('Error getting issue:', error);
    res.status(500).json({ message: 'Internal Server Error' });
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
    logger.error(`Error creating issue: `, error);
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
    logger.error(`Error updating issue: `, error);
    res.status(500).json({ message: 'Internal Server Error' });
    return;
  }
}
