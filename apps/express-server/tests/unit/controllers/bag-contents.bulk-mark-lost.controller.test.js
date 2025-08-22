import {
  describe, test, expect, beforeEach, vi,
} from 'vitest';
import Chance from 'chance';
import bagContentsBulkMarkLostController from '../../../controllers/bag-contents.bulk-mark-lost.controller.js';

import bulkMarkDiscLostService from '../../../services/bag-contents.bulk-mark-lost.service.js';

const chance = new Chance();

// Mock the service
vi.mock('../../../services/bag-contents.bulk-mark-lost.service.js', () => ({
  default: vi.fn(),
}));

describe('bagContentsBulkMarkLostController', () => {
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

    // Reset all mocks
    vi.clearAllMocks();
  });

  test('should export a function', () => {
    expect(typeof bagContentsBulkMarkLostController).toBe('function');
  });

  test('should call bulkMarkDiscLostService and send 200 with result', async () => {
    const contentIds = [chance.guid(), chance.guid()];
    const lostNotes = 'Lost at tournament';
    req.body = { content_ids: contentIds, lost_notes: lostNotes };

    const serviceResult = {
      success: true,
      updated_count: 2,
      failed_ids: [],
    };

    bulkMarkDiscLostService.mockResolvedValue(serviceResult);

    await bagContentsBulkMarkLostController(req, res, next);

    expect(bulkMarkDiscLostService).toHaveBeenCalledWith(
      req.user.userId,
      contentIds,
      { lost_notes: lostNotes },
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(serviceResult);
    expect(next).not.toHaveBeenCalled();
  });

  test('should send 400 when service returns error result', async () => {
    const contentIds = [chance.guid(), chance.guid()];
    req.body = { content_ids: contentIds, lost_notes: 'test' };

    const serviceResult = {
      success: false,
      message: 'No valid discs found for the provided content IDs',
      updated_count: 0,
      failed_ids: contentIds,
    };

    bulkMarkDiscLostService.mockResolvedValue(serviceResult);

    await bagContentsBulkMarkLostController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(serviceResult);
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next with error when service throws', async () => {
    const error = new Error('Service error');
    req.body = { content_ids: [chance.guid()], lost_notes: 'test' };

    bulkMarkDiscLostService.mockRejectedValue(error);

    await bagContentsBulkMarkLostController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  test('should return 400 when content_ids is missing', async () => {
    req.body = { lost_notes: 'test' };

    await bagContentsBulkMarkLostController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'content_ids is required',
    });
    expect(next).not.toHaveBeenCalled();
    expect(bulkMarkDiscLostService).not.toHaveBeenCalled();
  });

  test('should return 400 when content_ids is not an array', async () => {
    req.body = { content_ids: 'not-an-array', lost_notes: 'test' };

    await bagContentsBulkMarkLostController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'content_ids must be an array',
    });
    expect(next).not.toHaveBeenCalled();
    expect(bulkMarkDiscLostService).not.toHaveBeenCalled();
  });

  test('should return 400 when content_ids is empty array', async () => {
    req.body = { content_ids: [], lost_notes: 'test' };

    await bagContentsBulkMarkLostController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'content_ids cannot be empty',
    });
    expect(next).not.toHaveBeenCalled();
    expect(bulkMarkDiscLostService).not.toHaveBeenCalled();
  });

  test('should return 400 when lost_notes is not a string', async () => {
    req.body = { content_ids: [chance.guid()], lost_notes: 123 };

    await bagContentsBulkMarkLostController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'lost_notes must be a string if provided',
    });
    expect(next).not.toHaveBeenCalled();
    expect(bulkMarkDiscLostService).not.toHaveBeenCalled();
  });

  test('should return 400 when lost_notes exceeds 500 characters', async () => {
    const longNotes = 'a'.repeat(501);
    req.body = { content_ids: [chance.guid()], lost_notes: longNotes };

    await bagContentsBulkMarkLostController(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'lost_notes cannot exceed 500 characters',
    });
    expect(next).not.toHaveBeenCalled();
    expect(bulkMarkDiscLostService).not.toHaveBeenCalled();
  });

  test('should allow undefined lost_notes', async () => {
    req.body = { content_ids: [chance.guid()] };

    const serviceResult = {
      success: true,
      updated_count: 1,
      failed_ids: [],
    };

    bulkMarkDiscLostService.mockResolvedValue(serviceResult);

    await bagContentsBulkMarkLostController(req, res, next);

    expect(bulkMarkDiscLostService).toHaveBeenCalledWith(
      req.user.userId,
      [req.body.content_ids[0]],
      { lost_notes: undefined },
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(serviceResult);
    expect(next).not.toHaveBeenCalled();
  });

  test('should allow null lost_notes', async () => {
    req.body = { content_ids: [chance.guid()], lost_notes: null };

    const serviceResult = {
      success: true,
      updated_count: 1,
      failed_ids: [],
    };

    bulkMarkDiscLostService.mockResolvedValue(serviceResult);

    await bagContentsBulkMarkLostController(req, res, next);

    expect(bulkMarkDiscLostService).toHaveBeenCalledWith(
      req.user.userId,
      [req.body.content_ids[0]],
      { lost_notes: null },
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(serviceResult);
    expect(next).not.toHaveBeenCalled();
  });
});
