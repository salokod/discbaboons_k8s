import {
  describe, test, expect, vi, beforeAll,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

let coursesSearchController;
let coursesSearchService;

beforeAll(async () => {
  // Dynamically import the controller and mock the service
  coursesSearchService = vi.fn();
  vi.doMock('../../../services/courses.search.service.js', () => ({
    default: coursesSearchService,
  }));
  ({ default: coursesSearchController } = await import('../../../controllers/courses.search.controller.js'));
});

describe('coursesSearchController', () => {
  test('should export a function', () => {
    expect(typeof coursesSearchController).toBe('function');
  });

  test('should extract filters from query params and call service', async () => {
    const mockResult = {
      courses: [
        {
          id: chance.word(),
          name: chance.sentence(),
          city: chance.city(),
          state: chance.state(),
          approved: true,
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
      hasMore: false,
    };

    const req = {
      query: {
        state: chance.state(),
        city: chance.city(),
        name: chance.word(),
        limit: '25',
        offset: '10',
      },
    };

    const res = {
      json: vi.fn(),
    };

    const next = vi.fn();

    coursesSearchService.mockResolvedValue(mockResult);

    await coursesSearchController(req, res, next);

    expect(coursesSearchService).toHaveBeenCalledWith({
      state: req.query.state,
      stateProvince: undefined,
      country: undefined,
      city: req.query.city,
      name: req.query.name,
      is_user_submitted: undefined,
      approved: undefined,
      limit: req.query.limit,
      offset: req.query.offset,
    }, null);
    expect(res.json).toHaveBeenCalledWith(mockResult);
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next with error when service throws', async () => {
    const error = new Error(chance.sentence());

    const req = { query: {} };
    const res = { json: vi.fn() };
    const next = vi.fn();

    coursesSearchService.mockRejectedValue(error);

    await coursesSearchController(req, res, next);

    expect(coursesSearchService).toHaveBeenCalledWith({
      state: undefined,
      stateProvince: undefined,
      country: undefined,
      city: undefined,
      name: undefined,
      is_user_submitted: undefined,
      approved: undefined,
      limit: undefined,
      offset: undefined,
    }, null);
    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });

  test('should pass userId to service when user is authenticated', async () => {
    const userId = chance.integer({ min: 1 });
    const mockResult = {
      courses: [
        {
          id: chance.word(),
          name: chance.sentence(),
          approved: false,
          submitted_by_id: userId,
        },
      ],
      total: 1,
    };

    const req = {
      query: {
        stateProvince: 'CA',
        country: 'US',
      },
      user: { userId },
    };

    const res = {
      json: vi.fn(),
    };

    const next = vi.fn();

    coursesSearchService.mockResolvedValue(mockResult);

    await coursesSearchController(req, res, next);

    expect(coursesSearchService).toHaveBeenCalledWith({
      state: undefined,
      stateProvince: 'CA',
      country: 'US',
      city: undefined,
      name: undefined,
      is_user_submitted: undefined,
      approved: undefined,
      limit: undefined,
      offset: undefined,
    }, userId);
    expect(res.json).toHaveBeenCalledWith(mockResult);
    expect(next).not.toHaveBeenCalled();
  });

  test('should convert string query params to boolean for is_user_submitted=true', async () => {
    const mockResult = {
      courses: [
        {
          id: chance.word(),
          name: chance.sentence(),
          is_user_submitted: true,
          approved: true,
        },
      ],
      total: 1,
    };

    const req = {
      query: {
        is_user_submitted: 'true', // String from query param
      },
    };

    const res = {
      json: vi.fn(),
    };

    const next = vi.fn();

    coursesSearchService.mockResolvedValue(mockResult);

    await coursesSearchController(req, res, next);

    expect(coursesSearchService).toHaveBeenCalledWith({
      state: undefined,
      stateProvince: undefined,
      country: undefined,
      city: undefined,
      name: undefined,
      is_user_submitted: true, // Converted to boolean
      approved: undefined,
      limit: undefined,
      offset: undefined,
    }, null);
    expect(res.json).toHaveBeenCalledWith(mockResult);
    expect(next).not.toHaveBeenCalled();
  });

  test('should convert string query params to boolean for is_user_submitted=false', async () => {
    const mockResult = {
      courses: [],
      total: 0,
    };

    const req = {
      query: {
        is_user_submitted: 'false', // String from query param
      },
    };

    const res = {
      json: vi.fn(),
    };

    const next = vi.fn();

    coursesSearchService.mockResolvedValue(mockResult);

    await coursesSearchController(req, res, next);

    expect(coursesSearchService).toHaveBeenCalledWith({
      state: undefined,
      stateProvince: undefined,
      country: undefined,
      city: undefined,
      name: undefined,
      is_user_submitted: false, // Converted to boolean
      approved: undefined,
      limit: undefined,
      offset: undefined,
    }, null);
    expect(res.json).toHaveBeenCalledWith(mockResult);
    expect(next).not.toHaveBeenCalled();
  });

  test('should convert string query params to boolean for approved=true', async () => {
    const mockResult = {
      courses: [
        {
          id: chance.word(),
          name: chance.sentence(),
          approved: true,
        },
      ],
      total: 1,
    };

    const req = {
      query: {
        approved: 'true', // String from query param
      },
    };

    const res = {
      json: vi.fn(),
    };

    const next = vi.fn();

    coursesSearchService.mockResolvedValue(mockResult);

    await coursesSearchController(req, res, next);

    expect(coursesSearchService).toHaveBeenCalledWith({
      state: undefined,
      stateProvince: undefined,
      country: undefined,
      city: undefined,
      name: undefined,
      is_user_submitted: undefined,
      approved: true, // Converted to boolean
      limit: undefined,
      offset: undefined,
    }, null);
    expect(res.json).toHaveBeenCalledWith(mockResult);
    expect(next).not.toHaveBeenCalled();
  });

  test('should pass through invalid boolean values for service validation', async () => {
    const req = {
      query: {
        is_user_submitted: 'invalid', // Invalid string
        approved: '1', // Invalid string
      },
    };

    const res = {
      json: vi.fn(),
    };

    const next = vi.fn();

    const error = new Error('is_user_submitted must be a boolean value (true or false)');
    coursesSearchService.mockRejectedValue(error);

    await coursesSearchController(req, res, next);

    expect(coursesSearchService).toHaveBeenCalledWith({
      state: undefined,
      stateProvince: undefined,
      country: undefined,
      city: undefined,
      name: undefined,
      is_user_submitted: 'invalid', // Passed through as-is
      approved: '1', // Passed through as-is
      limit: undefined,
      offset: undefined,
    }, null);
    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });

  test('should combine boolean and text filters', async () => {
    const mockResult = {
      courses: [
        {
          id: chance.word(),
          name: chance.sentence(),
          state_province: 'CA',
          is_user_submitted: true,
          approved: false,
        },
      ],
      total: 1,
    };

    const req = {
      query: {
        stateProvince: 'CA',
        is_user_submitted: 'true',
        approved: 'false',
      },
      user: { userId: chance.integer({ min: 1 }) },
    };

    const res = {
      json: vi.fn(),
    };

    const next = vi.fn();

    coursesSearchService.mockResolvedValue(mockResult);

    await coursesSearchController(req, res, next);

    expect(coursesSearchService).toHaveBeenCalledWith({
      state: undefined,
      stateProvince: 'CA',
      country: undefined,
      city: undefined,
      name: undefined,
      is_user_submitted: true, // Converted to boolean
      approved: false, // Converted to boolean
      limit: undefined,
      offset: undefined,
    }, req.user.userId);
    expect(res.json).toHaveBeenCalledWith(mockResult);
    expect(next).not.toHaveBeenCalled();
  });
});
