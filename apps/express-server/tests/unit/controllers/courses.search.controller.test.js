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
      city: req.query.city,
      name: req.query.name,
      limit: req.query.limit,
      offset: req.query.offset,
    });
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

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});
