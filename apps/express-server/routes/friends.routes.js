import express from 'express';
import friendsRequestController from '../controllers/friends.request.controller.js';
import authenticateToken from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/request', authenticateToken, friendsRequestController);

export default router;
