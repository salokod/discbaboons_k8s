import {
  describe, test, expect, beforeEach, vi,
} from 'vitest';
import bagContentsBulkRecoverController from '../../../controllers/bag-contents.bulk-recover.controller.js';
import bulkRecoverDiscsService from '../../../services/bag-contents.bulk-recover.service.js';

// Mock the service
vi.mock('../../../services/bag-contents.bulk-recover.service.js', () => ({
  default: vi.fn(),
}));

describe('bagContentsBulkRecoverController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  test('should export a function', () => {
    expect(typeof bagContentsBulkRecoverController).toBe('function');
  });

  test('should call service and return 200 for successful recovery', async () => {
    const mockReq = {
      user: { userId: 'user123' },
      body: {
        content_ids: ['disc1', 'disc2'],
        bag_id: 'bag123',
      },
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const mockNext = vi.fn();

    const mockResult = {
      success: true,
      updated_count: 2,
      failed_ids: [],
    };

    bulkRecoverDiscsService.mockResolvedValue(mockResult);

    await bagContentsBulkRecoverController(mockReq, mockRes, mockNext);

    expect(bulkRecoverDiscsService).toHaveBeenCalledWith(
      'user123',
      ['disc1', 'disc2'],
      'bag123',
    );
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('should return 400 when service returns success: false', async () => {
    const mockReq = {
      user: { userId: 'user123' },
      body: {
        content_ids: ['disc1'],
        bag_id: 'bag123',
      },
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const mockNext = vi.fn();

    const mockResult = {
      success: false,
      message: 'No valid lost discs found for the provided content IDs',
      updated_count: 0,
      failed_ids: ['disc1'],
    };

    bulkRecoverDiscsService.mockResolvedValue(mockResult);

    await bagContentsBulkRecoverController(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('should call next with error when service throws', async () => {
    const mockReq = {
      user: { userId: 'user123' },
      body: {
        content_ids: ['disc1'],
        bag_id: 'bag123',
      },
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const mockNext = vi.fn();

    const error = new Error('Service error');
    bulkRecoverDiscsService.mockRejectedValue(error);

    await bagContentsBulkRecoverController(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  test('should return 400 when content_ids is missing', async () => {
    const mockReq = {
      user: { userId: 'user123' },
      body: { bag_id: 'bag123' },
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const mockNext = vi.fn();

    await bagContentsBulkRecoverController(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'content_ids is required',
    });
    expect(mockNext).not.toHaveBeenCalled();
    expect(bulkRecoverDiscsService).not.toHaveBeenCalled();
  });

  test('should return 400 when content_ids is not an array', async () => {
    const mockReq = {
      user: { userId: 'user123' },
      body: { content_ids: 'not-an-array', bag_id: 'bag123' },
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const mockNext = vi.fn();

    await bagContentsBulkRecoverController(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'content_ids must be an array',
    });
    expect(mockNext).not.toHaveBeenCalled();
    expect(bulkRecoverDiscsService).not.toHaveBeenCalled();
  });

  test('should return 400 when content_ids is empty array', async () => {
    const mockReq = {
      user: { userId: 'user123' },
      body: { content_ids: [], bag_id: 'bag123' },
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const mockNext = vi.fn();

    await bagContentsBulkRecoverController(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'content_ids cannot be empty',
    });
    expect(mockNext).not.toHaveBeenCalled();
    expect(bulkRecoverDiscsService).not.toHaveBeenCalled();
  });

  test('should return 400 when bag_id is missing', async () => {
    const mockReq = {
      user: { userId: 'user123' },
      body: { content_ids: ['disc1'] },
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const mockNext = vi.fn();

    await bagContentsBulkRecoverController(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: 'bag_id is required',
    });
    expect(mockNext).not.toHaveBeenCalled();
    expect(bulkRecoverDiscsService).not.toHaveBeenCalled();
  });
});
