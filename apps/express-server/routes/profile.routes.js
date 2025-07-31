import express from 'express';
import getProfileController from '../controllers/profile.get.controller.js';
import updateProfileController from '../controllers/profile.update.controller.js';
import searchProfilesController from '../controllers/profile.search.controller.js';
import authenticateToken from '../middleware/auth.middleware.js';
import {
  profileGetRateLimit,
  profileUpdateRateLimit,
  profileSearchRateLimit,
} from '../middleware/profileRateLimit.middleware.js';
import profileRequestLimit from '../middleware/profileRequestLimit.middleware.js';

const router = express.Router();

// IMPORTANT: Specific routes must come before general routes
// to avoid matching issues with Express routing

// GET /profile/search - Search for public profiles (public route)
// Note: This MUST come before the general GET / route
router.get('/search', profileSearchRateLimit, searchProfilesController);

// GET /profile - Get user's profile (protected route)
router.get('/', authenticateToken, profileGetRateLimit, getProfileController);

// PUT /profile - Update user's profile (protected route)
router.put('/', authenticateToken, profileRequestLimit, profileUpdateRateLimit, updateProfileController);

export default router;
