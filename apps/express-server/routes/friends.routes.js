import express from 'express';
import friendsRequestController from '../controllers/friends.request.controller.js';
import friendsRespondController from '../controllers/friends.respond.controller.js';
import friendsRequestsController from '../controllers/friends.requests.controller.js';
import friendsListController from '../controllers/friends.list.controller.js';
import authenticateToken from '../middleware/auth.middleware.js';
import {
  friendRequestRateLimit,
  friendRespondRateLimit,
  friendsListRateLimit,
} from '../middleware/friendsRateLimit.middleware.js';
import friendsRequestLimit from '../middleware/friendsRequestLimit.middleware.js';

const router = express.Router();

router.post('/request', friendRequestRateLimit, friendsRequestLimit, authenticateToken, friendsRequestController);
router.post('/respond', friendRespondRateLimit, friendsRequestLimit, authenticateToken, friendsRespondController);
router.get('/requests', friendsListRateLimit, authenticateToken, friendsRequestsController);
router.get('/', friendsListRateLimit, authenticateToken, friendsListController);

export default router;
