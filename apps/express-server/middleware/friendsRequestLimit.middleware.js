import express from 'express';

// Request size limits for friends endpoints (1KB should be plenty for friend operations)
const friendsRequestLimit = express.json({ limit: '1kb' });

export default friendsRequestLimit;
