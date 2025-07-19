import express from 'express';
import coursesSearchController from '../controllers/courses.search.controller.js';
import coursesGetController from '../controllers/courses.get.controller.js';
import coursesSubmitController from '../controllers/courses.submit.controller.js';
import coursesAdminController from '../controllers/courses.admin.controller.js';
import coursesEditController from '../controllers/courses.edit.controller.js';
import authenticateToken from '../middleware/auth.middleware.js';
import isAdmin from '../middleware/isadmin.middleware.js';

const router = express.Router();

// GET /api/courses - Search courses with optional filters (requires authentication)
router.get('/', authenticateToken, coursesSearchController);

// GET /api/courses/pending - Admin: List pending courses (requires admin)
router.get('/pending', authenticateToken, isAdmin, coursesAdminController.listPending);

// GET /api/courses/:id - Get course details (requires authentication)
router.get('/:id', authenticateToken, coursesGetController);

// POST /api/courses - Submit new course (requires authentication)
router.post('/', authenticateToken, coursesSubmitController);

// PUT /api/courses/:id/approve - Admin: Approve/reject course (requires admin)
router.put('/:id/approve', authenticateToken, isAdmin, coursesAdminController.approve);

// PUT /api/courses/:id - Edit course (user/friend/admin permissions)
router.put('/:id', authenticateToken, coursesEditController);

export default router;
