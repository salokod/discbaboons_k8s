import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

// Mock Prisma
const mockFindMany = vi.fn();
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    friendship_requests: { findMany: mockFindMany },
    findMany: mockFindMany,
    $disconnect: vi.fn(),
  })),
}));

const { default: getFriendRequestsService } = await import('../../../services/friends.requests.service.js');

describe('getFriendRequestsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  test('should be a function', () => {
    expect(typeof getFriendRequestsService).toBe('function');
  });

  test('should throw if userId is missing', async () => {
    await expect(getFriendRequestsService(undefined, 'incoming'))
      .rejects
      .toThrow(/user id is required/i);
  });

  test('should throw if type is missing', async () => {
    await expect(getFriendRequestsService(1))
      .rejects
      .toThrow(/type is required/i);
  });

  test('should throw if type is invalid', async () => {
    await expect(getFriendRequestsService(1, chance.word()))
      .rejects
      .toThrow(/type must be "incoming", "outgoing", or "all"/i);
  });

  test('should return incoming requests', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const fakeRequests = [
      {
        id: chance.integer({ min: 1000, max: 2000 }),
        requester_id: chance.integer({ min: 1, max: 1000 }),
        recipient_id: userId,
        status: 'pending',
      },
      {
        id: chance.integer({ min: 2001, max: 3000 }),
        requester_id: chance.integer({ min: 1, max: 1000 }),
        recipient_id: userId,
        status: 'pending',
      },
    ];
    mockFindMany.mockResolvedValue(fakeRequests);

    const result = await getFriendRequestsService(userId, 'incoming');
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { recipient_id: userId, status: 'pending' },
    });
    expect(result).toEqual(fakeRequests);
  });

  test('should return outgoing requests', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const fakeRequests = [
      {
        id: chance.integer({ min: 3001, max: 4000 }),
        requester_id: userId,
        recipient_id: chance.integer({ min: 1, max: 1000 }),
        status: 'pending',
      },
      {
        id: chance.integer({ min: 4001, max: 5000 }),
        requester_id: userId,
        recipient_id: chance.integer({ min: 1, max: 1000 }),
        status: 'pending',
      },
    ];
    mockFindMany.mockResolvedValue(fakeRequests);

    const result = await getFriendRequestsService(userId, 'outgoing');
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { requester_id: userId, status: 'pending' },
    });
    expect(result).toEqual(fakeRequests);
  });

  test('should return empty array if no requests found', async () => {
    mockFindMany.mockResolvedValue([]);
    const userId = chance.integer({ min: 1, max: 1000 });

    const result = await getFriendRequestsService(userId, 'incoming');
    expect(result).toEqual([]);
  });

  test('should return all requests (incoming and outgoing)', async () => {
    const userId = chance.integer({ min: 1, max: 1000 });
    const fakeRequests = [
      {
        id: chance.integer({ min: 5001, max: 6000 }),
        requester_id: chance.integer({ min: 1, max: 1000 }),
        recipient_id: userId,
        status: 'pending',
      }, // incoming
      {
        id: chance.integer({ min: 6001, max: 7000 }),
        requester_id: userId,
        recipient_id: chance.integer({ min: 1, max: 1000 }),
        status: 'pending',
      }, // outgoing
    ];
    mockFindMany.mockResolvedValue(fakeRequests);

    const result = await getFriendRequestsService(userId, 'all');
    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        status: 'pending',
        OR: [
          { recipient_id: userId },
          { requester_id: userId },
        ],
      },
    });
    expect(result).toEqual(fakeRequests);
  });
});
