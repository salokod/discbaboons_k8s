import {
  describe, test, expect, vi, beforeAll,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

let bagContentsMarkLostController;
let markDiscLostService;

beforeAll(async () => {
  // Dynamically import the controller and mock the service
  markDiscLostService = vi.fn();
  vi.doMock('../../../services/bag-contents.mark-lost.service.js', () => ({
    default: markDiscLostService,
  }));
  ({ default: bagContentsMarkLostController } = await import('../../../controllers/bag-contents.mark-lost.controller.js'));
});

describe('bagContentsMarkLostController', () => {
  test('should export a function', () => {
    expect(typeof bagContentsMarkLostController).toBe('function');
  });

  test('should call markDiscLostService and send 200 with updated content', async () => {
    const mockUserId = chance.integer({ min: 1 });
    const mockContentId = chance.guid({ version: 4 });
    const mockLostData = {
      is_lost: true,
      lost_notes: chance.sentence(),
    };
    const mockUpdatedContent = {
      id: mockContentId,
      is_lost: true,
      lost_notes: mockLostData.lost_notes,
      lost_at: new Date(),
    };

    markDiscLostService.mockResolvedValue(mockUpdatedContent);

    const req = {
      user: { userId: mockUserId },
      params: { contentId: mockContentId },
      body: mockLostData,
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await bagContentsMarkLostController(req, res, next);

    expect(markDiscLostService).toHaveBeenCalledWith(mockUserId, mockContentId, mockLostData);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      bag_content: mockUpdatedContent,
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should send 404 when service returns null', async () => {
    const mockUserId = chance.integer({ min: 1 });
    const mockContentId = chance.guid({ version: 4 });
    const mockLostData = { is_lost: false };

    markDiscLostService.mockResolvedValue(null);

    const req = {
      user: { userId: mockUserId },
      params: { contentId: mockContentId },
      body: mockLostData,
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await bagContentsMarkLostController(req, res, next);

    expect(markDiscLostService).toHaveBeenCalledWith(mockUserId, mockContentId, mockLostData);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Bag content not found or access denied',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should call next with error when service throws', async () => {
    const mockUserId = chance.integer({ min: 1 });
    const mockContentId = chance.guid({ version: 4 });
    const mockLostData = { is_lost: true };
    const mockError = new Error('Service error');

    markDiscLostService.mockRejectedValue(mockError);

    const req = {
      user: { userId: mockUserId },
      params: { contentId: mockContentId },
      body: mockLostData,
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const next = vi.fn();

    await bagContentsMarkLostController(req, res, next);

    expect(markDiscLostService).toHaveBeenCalledWith(mockUserId, mockContentId, mockLostData);
    expect(next).toHaveBeenCalledWith(mockError);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
