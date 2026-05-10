import { Router } from 'express';
import { createIssue, deleteIssue, getIssue, listIssues, patchIssue } from '../controllers/issue';
import { requireAuth, requireRoleAtLeast } from '../middleware/requireAuth';
import {
  validateIdParam,
  validatePostIssueBody,
  validatePatchIssueBody,
  validateGetIssuesQuery,
} from '../middleware/validation';

const issueRouter = Router();

// Public — anyone can submit a bug report
issueRouter.post('/issues', validatePostIssueBody, createIssue);

// Admin-gated — only Admin+ can read the queue or a single report
issueRouter.get(
  '/issues',
  requireAuth,
  requireRoleAtLeast('Admin'),
  validateGetIssuesQuery,
  listIssues
);
issueRouter.get('/issues/:id', requireAuth, requireRoleAtLeast('Admin'), validateIdParam, getIssue);

// Admin-gated — triage (partial update) and removal
issueRouter.patch(
  '/issues/:id',
  requireAuth,
  requireRoleAtLeast('Admin'),
  validateIdParam,
  validatePatchIssueBody,
  patchIssue
);
issueRouter.delete(
  '/issues/:id',
  requireAuth,
  requireRoleAtLeast('Admin'),
  validateIdParam,
  deleteIssue
);

export default issueRouter;
