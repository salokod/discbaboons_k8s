import express from 'express';

// Request size limits for course endpoints
const courseRequestLimit = express.json({ limit: '100kb' }); // Courses don't need large payloads
const courseAdminRequestLimit = express.json({ limit: '50kb' }); // Admin actions are smaller

export {
  courseRequestLimit,
  courseAdminRequestLimit,
};
