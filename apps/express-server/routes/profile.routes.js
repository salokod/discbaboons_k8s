import express from 'express';
import getProfileController from '../controllers/profile.get.controller.js';
import authenticateToken from '../middleware/auth.middleware.js';

const router = express.Router();

// GET /profile - Get user's profile (protected route)
router.get('/', authenticateToken, getProfileController);

export default router;
