import express from 'express';
import friendsRequestController from '../controllers/friends.request.controller.js';
import friendsRespondController from '../controllers/friends.respond.controller.js';
import authenticateToken from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/request', authenticateToken, friendsRequestController);
router.post('/respond', authenticateToken, friendsRespondController);

export default router;
