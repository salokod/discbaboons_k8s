import 'express-async-errors';
import express from 'express';
import { hostname } from 'os';
import dotenv from 'dotenv';
import authRouter from './routes/auth.routes.js';
import profileRouter from './routes/profile.routes.js';
import friendsRouter from './routes/friends.routes.js';
import discsRouter from './routes/discs.routes.js';
import bagsRouter from './routes/bags.routes.js';
import coursesRouter from './routes/courses.routes.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware with better error handling
app.use(express.json({
  strict: false, // Allow non-objects (strings, numbers)
  limit: '10mb', // Set reasonable limit
}));

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

// Add the missing /api/info route
app.get('/api/info', (req, res) => {
  res.json({
    service: 'discbaboons-express',
    environment: process.env.NODE_ENV || 'development',
    hostname: hostname(),
    pid: process.pid,
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/friends', friendsRouter);
app.use('/api/discs', discsRouter);
app.use('/api/bags', bagsRouter);
app.use('/api/courses', coursesRouter);

// 404 handler for unknown routes (must be AFTER all other routes but BEFORE error handler)
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

// Use the imported error handler (must be LAST)
app.use(errorHandler);

// Start server (only if not in test mode)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`ℹ️  Info endpoint: http://localhost:${PORT}/api/info`);
  });
}

export default app;
