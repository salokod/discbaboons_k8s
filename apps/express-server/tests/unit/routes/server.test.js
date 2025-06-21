import request from 'supertest';
import app from '../../../server.js';

describe('Express Server', () => {
  describe('GET /', () => {
    it('should return welcome message with server info', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Hello from my Kubernetes cluster!');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('hostname');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('nodeVersion');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('timestamp');
      expect(typeof response.body.uptime).toBe('number');
    });
  });

  describe('GET /api/info', () => {
    it('should return service information', async () => {
      const response = await request(app)
        .get('/api/info')
        .expect(200);

      expect(response.body).toHaveProperty('service', 'discbaboons-express');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('hostname');
      expect(response.body).toHaveProperty('pid');
      expect(response.body).toHaveProperty('memory');
      expect(typeof response.body.pid).toBe('number');
    });
  });

  describe('GET /nonexistent', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Route not found');
      expect(response.body).toHaveProperty('path', '/nonexistent');
    });
  });

  describe('Error handling', () => {
    it('should handle JSON parsing errors gracefully', async () => {
      const response = await request(app)
        .post('/api/info')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);

      // Your errorHandler returns { success: false, message: "..." }
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });
  });
});
