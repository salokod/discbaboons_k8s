// apps/express-server/routes/users.js
// Add database integration - TDD Step 3

import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

// Updated route - now with database integration
router.get('/', async (req, res) => {
  try {
    // Query the database using Prisma
    const users = await prisma.users.findMany({
      select: {
        id: true,
        username: true,
        created_at: true,
        user_profiles: true, // Include user profile data
        // Note: password_hash excluded for security
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.log('this is mf error', error); // Debugging log
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
    });
  }
});

export default router;
