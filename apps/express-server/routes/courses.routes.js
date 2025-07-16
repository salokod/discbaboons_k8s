import express from 'express';
import coursesSearchController from '../controllers/courses.search.controller.js';
import authenticateToken from '../middleware/auth.middleware.js';

const router = express.Router();

// GET /api/courses - Search courses with optional filters (requires authentication)
router.get('/', authenticateToken, coursesSearchController);

export default router;