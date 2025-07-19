import {
  describe, test, expect, vi, beforeAll,
} from 'vitest';
import express from 'express';
import request from 'supertest';
import Chance from 'chance';

const chance = new Chance();

let coursesRouter;
let courseSearchCont;
let courseGetCont;
let courseSubmitCont;
let authenticateToken;

beforeAll(async () => {
  // Mock the controllers
  courseSearchCont = vi.fn((req, res) => {
    res.json({ message: 'search controller called' });
  });

  courseGetCont = vi.fn((req, res) => {
    res.json({ message: 'get controller called' });
  });

  courseSubmitCont = vi.fn((req, res) => {
    res.status(201).json({ message: 'submit controller called' });
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

  vi.doMock('../../../controllers/courses.submit.controller.js', () => ({
    default: courseSubmitCont,
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

    const testState = chance.state();
    const testCity = chance.city();
    const testName = chance.word();

    await request(app)
      .get(`/api/courses?state=${encodeURIComponent(testState)}&city=${encodeURIComponent(testCity)}&name=${encodeURIComponent(testName)}`)
      .expect(200);

    expect(courseSearchCont).toHaveBeenCalled();
    const lastCall = courseSearchCont.mock.calls[courseSearchCont.mock.calls.length - 1];
    const req = lastCall[0];
    expect(req.query).toEqual({
      state: testState,
      city: testCity,
      name: testName,
    });
  });

  test('GET /api/courses/:id should require authentication and call get controller', async () => {
    const app = express();
    app.use('/api/courses', coursesRouter);

    const testCourseId = chance.string();
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

  test('POST /api/courses should require authentication and call submit controller', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/courses', coursesRouter);

    const courseData = {
      name: chance.string(),
      city: chance.city(),
      stateProvince: chance.state({ abbreviated: true }),
      country: chance.string({ length: 2, alpha: true }).toUpperCase(),
    };

    const response = await request(app)
      .post('/api/courses')
      .send(courseData)
      .expect(201);

    expect(response.body).toEqual({ message: 'submit controller called' });
    expect(authenticateToken).toHaveBeenCalled();
    expect(courseSubmitCont).toHaveBeenCalled();
  });

  test('POST /api/courses should pass course data in request body', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/courses', coursesRouter);

    const courseData = {
      name: chance.string(),
      city: chance.city(),
      stateProvince: chance.state({ abbreviated: true }),
      country: chance.string({ length: 2, alpha: true }).toUpperCase(),
      holeCount: chance.integer({ min: 9, max: 27 }),
    };

    await request(app)
      .post('/api/courses')
      .send(courseData)
      .expect(201);

    expect(courseSubmitCont).toHaveBeenCalled();
    const lastCall = courseSubmitCont.mock.calls[courseSubmitCont.mock.calls.length - 1];
    const req = lastCall[0];
    expect(req.body).toEqual(courseData);
  });
});
