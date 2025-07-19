import {
  describe, test, expect, vi, beforeAll,
} from 'vitest';
import express from 'express';
import request from 'supertest';

let coursesRouter;
let courseSearchCont;
let courseGetCont;
let authenticateToken;

beforeAll(async () => {
  // Mock the controllers
  courseSearchCont = vi.fn((req, res) => {
    res.json({ message: 'search controller called' });
  });

  courseGetCont = vi.fn((req, res) => {
    res.json({ message: 'get controller called' });
  });

  // Mock the auth middleware
  authenticateToken = vi.fn((req, res, next) => {
    req.user = { userId: 1 };
    next();
  });

  vi.doMock('../../../controllers/courses.search.controller.js', () => ({
    default: courseSearchCont,
  }));

  vi.doMock('../../../controllers/courses.get.controller.js', () => ({
    default: courseGetCont,
  }));

  vi.doMock('../../../middleware/auth.middleware.js', () => ({
    default: authenticateToken,
  }));

  // Import the router after mocking
  ({ default: coursesRouter } = await import('../../../routes/courses.routes.js'));
});

describe('courses routes', () => {
  test('GET /api/courses should require authentication and call controller', async () => {
    const app = express();
    app.use('/api/courses', coursesRouter);

    const response = await request(app)
      .get('/api/courses')
      .expect(200);

    expect(response.body).toEqual({ message: 'search controller called' });
    expect(authenticateToken).toHaveBeenCalled();
    expect(courseSearchCont).toHaveBeenCalled();
  });

  test('GET /api/courses with query params should pass to controller', async () => {
    const app = express();
    app.use('/api/courses', coursesRouter);

    await request(app)
      .get('/api/courses?state=California&city=Sacramento&name=Capitol')
      .expect(200);

    expect(courseSearchCont).toHaveBeenCalled();
    const lastCall = courseSearchCont.mock.calls[courseSearchCont.mock.calls.length - 1];
    const req = lastCall[0];
    expect(req.query).toEqual({
      state: 'California',
      city: 'Sacramento',
      name: 'Capitol',
    });
  });

  test('GET /api/courses/:id should require authentication and call get controller', async () => {
    const app = express();
    app.use('/api/courses', coursesRouter);

    const testCourseId = 'test-course-id';
    const response = await request(app)
      .get(`/api/courses/${testCourseId}`)
      .expect(200);

    expect(response.body).toEqual({ message: 'get controller called' });
    expect(authenticateToken).toHaveBeenCalled();
    expect(courseGetCont).toHaveBeenCalled();

    // Verify courseId is passed in params
    const lastCall = courseGetCont.mock.calls[courseGetCont.mock.calls.length - 1];
    const req = lastCall[0];
    expect(req.params.id).toBe(testCourseId);
  });
});
