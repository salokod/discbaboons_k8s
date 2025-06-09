import express from 'express';
import { hostname } from 'os';
import dotenv from 'dotenv';
import usersRouter from './routes/users.js';
import authRouter from './routes/auth.routes.js'; // ADD THIS LINE

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware with better error handling
app.use(express.json({
  strict: false, // Allow non-objects (strings, numbers)
  limit: '10mb', // Set reasonable limit
}));

// Add error handler for JSON parsing
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON in request body',
    });
  }
  return next();
});

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Hello from my Kubernetes cluster!',
    timestamp: new Date().toISOString(),
    hostname: hostname(),
    version: '1.0.0',
    nodeVersion: process.version,
    spiro: true,
    lol: false,
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ADD THE USERS ROUTE HERE
app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);

app.get('/api/info', (req, res) => {
  res.json({
    service: 'discbaboons-express',
    environment: process.env.NODE_ENV || 'development',
    hostname: hostname(),
    pid: process.pid,
    memory: process.memoryUsage(),
    logLevel: process.env.LOG_LEVEL || 'not set',
    // Show we have secrets without exposing them
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasApiKey: !!process.env.API_KEY,
    hasDbPassword: !!process.env.DB_PASSWORD,
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

// Error handler
app.use((err, req, res, _next) => {
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

// Start server (only if not in test mode)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`ℹ️  Info endpoint: http://localhost:${PORT}/api/info`);
  });
}

export default app;
// apps/express-server/server.js
// This file sets up the Express server, configures routes, and handles errors.
