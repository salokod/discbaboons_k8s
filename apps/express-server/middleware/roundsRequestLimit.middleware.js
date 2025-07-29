import express from 'express';

// Request size limits for rounds endpoints
const roundsRequestLimit = express.json({ limit: '50kb' }); // Most rounds operations are small
const roundsScoringRequestLimit = express.json({ limit: '100kb' }); // Scoring data might be larger

export {
  roundsRequestLimit,
  roundsScoringRequestLimit,
};
