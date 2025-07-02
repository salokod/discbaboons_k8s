import {
  describe, test, expect, vi, beforeAll,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

let bagContentsEditController;
let editBagContentService;

beforeAll(async () => {
  // Dynamically import the controller and mock the service
  editBagContentService = vi.fn();
  vi.doMock('../../../services/bag-contents.edit.service.js', () => ({
    default: editBagContentService,
  }));
  ({ default: bagContentsEditController } = await import('../../../controllers/bag-contents.edit.controller.js'));
});

describe('bagContentsEditController', () => {
  test('should export a function', () => {
    expect(typeof bagContentsEditController).toBe('function');
  });

  test('should call editBagContentService and send 200 with updated content', async () => {
    const mockUserId = chance.integer({ min: 1 });
    const mockBagId = chance.guid({ version: 4 });
    const mockContentId = chance.guid({ version: 4 });
    const mockUpdateData = {
      notes: chance.sentence(),
      weight: chance.floating({ min: 150, max: 180, fixed: 1 }),
      condition: chance.pickone(['new', 'good', 'worn', 'beat-in']),
      speed: chance.integer({ min: 1, max: 15 }),
    };
    const mockUpdatedContent = {
      id: mockContentId,
      bag_id: mockBagId,
      notes: mockUpdateData.notes,
      weight: mockUpdateData.weight,
      condition: mockUpdateData.condition,
      speed: mockUpdateData.speed,
    };

    editBagContentService.mockResolvedValueOnce(mockUpdatedContent);

    const req = {
      user: { userId: mockUserId },
      params: { id: mockBagId, contentId: mockContentId },
      body: mockUpdateData,
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await bagContentsEditController(req, res);

    expect(editBagContentService).toHaveBeenCalledWith(
      mockUserId,
      mockBagId,
      mockContentId,
      mockUpdateData,
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, bag_content: mockUpdatedContent });
  });

  test('should call next(err) if editBagContentService throws', async () => {
    const mockUserId = chance.integer({ min: 1 });
    const mockBagId = chance.guid({ version: 4 });
    const mockContentId = chance.guid({ version: 4 });
    const mockUpdateData = { notes: chance.sentence() };
    const mockError = new Error(chance.sentence());
    editBagContentService.mockRejectedValueOnce(mockError);

    const req = {
      user: { userId: mockUserId },
      params: { id: mockBagId, contentId: mockContentId },
      body: mockUpdateData,
    };
    const res = {};
    const next = vi.fn();

    await bagContentsEditController(req, res, next);

    expect(next).toHaveBeenCalledWith(mockError);
  });
});
