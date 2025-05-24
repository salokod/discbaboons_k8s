import express from 'express';
import { hostname } from 'os';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Hello from my Kubernetes cluster!',
    timestamp: new Date().toISOString(),
    hostname: hostname(),
    version: '1.0.0',
    nodeVersion: process.version,
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    service: 'discbaboons-express',
    environment: process.env.NODE_ENV || 'development',
    hostname: hostname(),
    pid: process.pid,
    memory: process.memoryUsage(),
    logLevel: process.env.LOG_LEVEL || 'not set',
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
  console.error(err.stack);
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
