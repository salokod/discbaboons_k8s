import {
  describe, test, expect, beforeEach, vi,
} from 'vitest';

// Mock Prisma
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    friendship_requests: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
    $disconnect: vi.fn(),
  })),
}));

// Import AFTER mocking
const { default: respondToFriendRequestService } = await import('../../../services/friends.respond.service.js');

describe('respondToFriendRequestService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  test('should be a function', () => {
    expect(typeof respondToFriendRequestService).toBe('function');
  });

  test('should throw if requestId is missing', async () => {
    await expect(respondToFriendRequestService(undefined, 1, 'accept'))
      .rejects
      .toThrow(/request id is required/i);
  });

  test('should throw if userId is missing', async () => {
    await expect(respondToFriendRequestService(1, undefined, 'accept'))
      .rejects
      .toThrow(/user id is required/i);
  });

  test('should throw if action is missing', async () => {
    await expect(respondToFriendRequestService(1, 2, undefined))
      .rejects
      .toThrow(/action must be "accept" or "deny"/i);
  });

  test('should throw if action is invalid', async () => {
    await expect(respondToFriendRequestService(1, 2, 'foobar'))
      .rejects
      .toThrow(/action must be "accept" or "deny"/i);
  });

  test('should throw if friend request does not exist', async () => {
  // We'll use a fake Prisma mock for now
    const fakeRequestId = 99999;
    const fakeUserId = 1;
    const action = 'accept';

    // You may need to mock your DB call here if you use dependency injection or a mock library.
    await expect(respondToFriendRequestService(fakeRequestId, fakeUserId, action))
      .rejects
      .toThrow(/friend request not found/i);
  });

  test('should throw if user is not the recipient', async () => {
    // Mock a found request with recipient_id = 42
    mockFindUnique.mockResolvedValue({
      id: 1,
      requester_id: 10,
      recipient_id: 42,
      status: 'pending',
    });

    // Try to respond as a different user
    await expect(respondToFriendRequestService(1, 99, 'accept'))
      .rejects
      .toThrow(/not authorized/i);
  });

  test('should throw if request is not pending', async () => {
  // Mock a found request with status 'accepted'
    mockFindUnique.mockResolvedValue({
      id: 1,
      requester_id: 10,
      recipient_id: 42,
      status: 'accepted',
    });

    await expect(respondToFriendRequestService(1, 42, 'accept'))
      .rejects
      .toThrow(/request is not pending/i);
  });

  test('should update status to accepted and return updated request', async () => {
    mockFindUnique.mockResolvedValue({
      id: 1,
      requester_id: 10,
      recipient_id: 42,
      status: 'pending',
    });

    const updatedRequest = {
      id: 1,
      requester_id: 10,
      recipient_id: 42,
      status: 'accepted',
    };
    mockUpdate.mockResolvedValue(updatedRequest);

    const result = await respondToFriendRequestService(1, 42, 'accept');
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: 'accepted' },
    });
    expect(result).toEqual(updatedRequest);
  });

  test('should update status to denied and return updated request', async () => {
    mockFindUnique.mockResolvedValue({
      id: 2,
      requester_id: 11,
      recipient_id: 43,
      status: 'pending',
    });

    const updatedRequest = {
      id: 2,
      requester_id: 11,
      recipient_id: 43,
      status: 'denied',
    };
    mockUpdate.mockResolvedValue(updatedRequest);

    const result = await respondToFriendRequestService(2, 43, 'deny');
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { status: 'denied' },
    });
    expect(result).toEqual(updatedRequest);
  });
});
