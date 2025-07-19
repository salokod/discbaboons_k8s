import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

// Mock the service
vi.mock('../../../services/courses.submit.service.js', () => ({
  default: vi.fn(),
}));

import coursesSubmitController from '../../../controllers/courses.submit.controller.js';
import coursesSubmitService from '../../../services/courses.submit.service.js';

const mockCoursesSubmitService = vi.mocked(coursesSubmitService);

describe('courses.submit.controller', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      user: { userId: chance.integer({ min: 1 }) },
      body: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
    mockCoursesSubmitService.mockClear();
  });

  it('should export a function', () => {
    expect(typeof coursesSubmitController).toBe('function');
  });

  it('should call coursesSubmitService with userId and request body', async () => {
    const userId = chance.integer({ min: 1 });
    const courseData = {
      name: chance.string(),
      city: chance.city(),
      stateProvince: chance.state({ abbreviated: true }),
      country: chance.string({ length: 2, alpha: true }).toUpperCase(),
    };

    req.user.userId = userId;
    req.body = courseData;

    const mockResult = { id: chance.string() };
    mockCoursesSubmitService.mockResolvedValue(mockResult);

    await coursesSubmitController(req, res, next);

    expect(mockCoursesSubmitService).toHaveBeenCalledWith(userId, courseData);
  });

  it('should return the result with status 201', async () => {
    const mockResult = { id: chance.string() };
    mockCoursesSubmitService.mockResolvedValue(mockResult);

    await coursesSubmitController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockResult);
  });

  it('should call next with error if service throws', async () => {
    const error = new Error(chance.sentence());
    mockCoursesSubmitService.mockRejectedValue(error);

    await coursesSubmitController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});