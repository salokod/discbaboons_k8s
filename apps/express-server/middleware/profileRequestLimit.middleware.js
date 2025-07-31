import express from 'express';

// Request size limits for profile endpoints
const profileRequestLimit = express.json({ limit: '10kb' }); // Profile updates are small

export default profileRequestLimit;
