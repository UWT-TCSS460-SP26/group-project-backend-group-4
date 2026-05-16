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

    if (process.env.DISCORD_ISSUE_NOTIFICATION_WEBHOOK) {
      await fetch(process.env.DISCORD_ISSUE_NOTIFICATION_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'Issue Reporter',
          embeds: [
            {
              title: `New Issue #${issue.id}: ${issue.title}`,
              description: `${issue.body}\nContact: ${issue.contact}\n\n${process.env.ISSUE_TRACKER_URL}/issue/${issue.id}`,
              color: 16711680,
              footer: {
                text: 'Created At:',
              },
              timestamp: issue.createdAt,
            },
          ],
          attachments: [],
        }),
      });
    }
  } catch (error) {
    logger.error(`Error creating issue: `, error);
    res.status(500).json({ message: 'Internal Server Error' });
    return;
  }
}

/**
 * PATCH /issues/:id — Admin-gated partial update for triage.
 * Accepts a partial body: only provided fields are merged into the issue.
 * An empty body is a no-op (200).
 * Unknown status values are caught by Zod validation (400).
 */
export async function patchIssue(req: Request, res: Response) {
  const issueId = res.locals.id as number;
  const patch = req.body as Record<string, unknown>;

  try {
    const issue = await prisma.issue.findUnique({
      where: { id: issueId, deleted: false },
    });

    if (issue === null) {
      res.status(404).json({ message: 'Issue not found' });
      return;
    }

    // Only include fields that were actually sent in the request body.
    // This is what makes PATCH a "merge" rather than a "replace."
    const data: Record<string, unknown> = {};
    for (const key of ['title', 'body', 'contact', 'status'] as const) {
      if (key in patch) {
        data[key] = patch[key];
      }
    }

    const updated = await prisma.issue.update({
      where: { id: issueId },
      data,
      omit: { deleted: true },
    });

    res.status(200).json({ message: 'Issue updated', issue: updated });
  } catch (error) {
    logger.error('Error patching issue:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}

/**
 * DELETE /issues/:id — Admin-gated soft-delete.
 * Sets deleted=true rather than removing the row, preserving an audit trail.
 * Returns 404 for already-deleted or nonexistent issues.
 */
export async function deleteIssue(req: Request, res: Response) {
  const issueId = res.locals.id as number;

  try {
    const issue = await prisma.issue.findUnique({
      where: { id: issueId, deleted: false },
    });

    if (issue === null) {
      res.status(404).json({ message: 'Issue not found' });
      return;
    }

    const deleted = await prisma.issue.update({
      where: { id: issueId },
      data: { deleted: true },
      omit: { deleted: true },
    });

    res.status(200).json({ message: 'Issue deleted', issue: deleted });
  } catch (error) {
    logger.error('Error deleting issue:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
