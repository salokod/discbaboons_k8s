import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

// Mock the service BEFORE importing controller
vi.mock('../../../services/courses.get.service.js', () => ({
  default: vi.fn(),
}));

// Dynamic import AFTER mocking
const { default: coursesGetController } = await import('../../../controllers/courses.get.controller.js');

describe('courses.get.controller', () => {
  let mockCoursesGetService;
  let req;
  let res;
  let next;

  beforeEach(async () => {
    // Get reference to mocked service
    const service = await import('../../../services/courses.get.service.js');
    mockCoursesGetService = service.default;

    req = {
      params: {},
    };
    res = {
      json: vi.fn(),
    };
    next = vi.fn();

    vi.clearAllMocks();
  });

  it('should export a function', () => {
    expect(typeof coursesGetController).toBe('function');
  });

  it('should call service with courseId and return course data', async () => {
    const testCourseId = chance.string({ alpha: true });
    const mockCourse = {
      id: testCourseId,
      name: chance.string(),
      city: chance.city(),
      state: chance.state(),
    };

    req.params.id = testCourseId;
    mockCoursesGetService.mockResolvedValue(mockCourse);

    await coursesGetController(req, res, next);

    expect(mockCoursesGetService).toHaveBeenCalledWith(testCourseId, null);
    expect(res.json).toHaveBeenCalledWith(mockCourse);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next with error when service throws', async () => {
    const testCourseId = chance.string({ alpha: true });
    const testError = new Error('Service error');

    req.params.id = testCourseId;
    mockCoursesGetService.mockRejectedValue(testError);

    await coursesGetController(req, res, next);

    expect(mockCoursesGetService).toHaveBeenCalledWith(testCourseId, null);
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(testError);
  });

  it('should pass userId to service when user is authenticated', async () => {
    const testCourseId = chance.string({ alpha: true });
    const userId = chance.integer({ min: 1 });
    const mockCourse = {
      id: testCourseId,
      name: chance.string(),
      approved: false,
      submitted_by_id: userId,
    };

    req.params.id = testCourseId;
    req.user = { userId };
    mockCoursesGetService.mockResolvedValue(mockCourse);

    await coursesGetController(req, res, next);

    expect(mockCoursesGetService).toHaveBeenCalledWith(testCourseId, userId);
    expect(res.json).toHaveBeenCalledWith(mockCourse);
    expect(next).not.toHaveBeenCalled();
  });
});
