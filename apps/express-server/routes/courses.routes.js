import express from 'express';
import coursesSearchController from '../controllers/courses.search.controller.js';
import coursesGetController from '../controllers/courses.get.controller.js';
import authenticateToken from '../middleware/auth.middleware.js';

const router = express.Router();

// GET /api/courses - Search courses with optional filters (requires authentication)
router.get('/', authenticateToken, coursesSearchController);

// GET /api/courses/:id - Get course details (requires authentication)
router.get('/:id', authenticateToken, coursesGetController);

export default router;
