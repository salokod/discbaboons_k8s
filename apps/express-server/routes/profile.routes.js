import express from 'express';
import getProfileController from '../controllers/profile.get.controller.js';
import updateProfileController from '../controllers/profile.update.controller.js';
import authenticateToken from '../middleware/auth.middleware.js';

const router = express.Router();

// GET /profile - Get user's profile (protected route)
router.get('/', authenticateToken, getProfileController);

// PUT /profile - Update user's profile (protected route)
router.put('/', authenticateToken, updateProfileController);

export default router;