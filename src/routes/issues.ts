import { Router } from 'express';
import { createIssue, getIssue, listIssues, updateIssue } from '../controllers/issue';
import { requireAuth, requireRoleAtLeast } from '../middleware/requireAuth';
import {
  validateIdParam,
  validatePostIssueBody,
  validatePutIssueBody,
  validateGetIssuesQuery,
} from '../middleware/validation';

const issueRouter = Router();

// Public — anyone can submit a bug report
issueRouter.post('/issues', validatePostIssueBody, createIssue);

// Admin-gated — only Admin+ can read the queue or a single report
issueRouter.get('/issues', requireAuth, requireRoleAtLeast('Admin'), validateGetIssuesQuery, listIssues);
issueRouter.get('/issues/:id', requireAuth, requireRoleAtLeast('Admin'), validateIdParam, getIssue);

// Admin-gated update (existing — will be properly gated in Story 2)
issueRouter.put('/issues/:id', validateIdParam, validatePutIssueBody, updateIssue);

export default issueRouter;
