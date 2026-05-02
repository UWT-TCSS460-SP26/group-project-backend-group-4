import { Router } from 'express';
import { createIssue, getIssue, updateIssue } from '../controllers/issue';
import {
  validateIdParam,
  validatePostIssueBody,
  validatePutIssueBody,
} from '../middleware/validation';

const issueRouter = Router();

issueRouter.post('/issues', validatePostIssueBody, createIssue);
issueRouter.get('/issues', getIssue);
issueRouter.get('/issues/:id', validateIdParam, getIssue);
issueRouter.put('/issues/:id', validateIdParam, validatePutIssueBody, updateIssue);

export default issueRouter;
