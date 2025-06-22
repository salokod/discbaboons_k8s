import {
  describe, test, expect, beforeEach, vi,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

// Mock Prisma
const mockFindUnique = vi.fn();
const mockCreate = vi.fn();

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    friendship_requests: {
      findUnique: mockFindUnique,
      create: mockCreate,
    },
    $disconnect: vi.fn(),
  })),
}));

const { default: friendsRequestService } = await import('../../../services/friends.request.service.js');

describe('friendsRequestService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should export a function', () => {
    expect(typeof friendsRequestService).toBe('function');
  });

  test('should throw if requesterId is missing', async () => {
    await expect(friendsRequestService()).rejects.toThrow('Requester ID is required');
    await expect(friendsRequestService(null, chance.integer({ min: 2, max: 1000 }))).rejects.toThrow('Requester ID is required');
  });

  test('should throw if recipientId is missing', async () => {
    await expect(friendsRequestService(chance.integer({ min: 1, max: 1000 }))).rejects.toThrow('Recipient ID is required');
    await expect(friendsRequestService(chance.integer({ min: 1, max: 1000 }), null)).rejects.toThrow('Recipient ID is required');
  });

  test('should throw if requesterId and recipientId are the same', async () => {
    const id = chance.integer({ min: 1, max: 1000 });
    await expect(friendsRequestService(id, id)).rejects.toThrow('Cannot send friend request to yourself');
  });

  test('should throw if a request already exists between users', async () => {
    const requesterId = chance.integer({ min: 1, max: 1000 });
    let recipientId = chance.integer({ min: 1, max: 1000 });
    while (recipientId === requesterId) {
      recipientId = chance.integer({ min: 1, max: 1000 });
    }
    mockFindUnique.mockResolvedValue({ id: chance.integer({ min: 1001, max: 2000 }), status: 'pending' });
    await expect(friendsRequestService(requesterId, recipientId)).rejects.toThrow('Friend request already exists');
  });

  test('should create and return a new friend request if none exists', async () => {
    const requesterId = chance.integer({ min: 1, max: 1000 });
    let recipientId = chance.integer({ min: 1, max: 1000 });
    while (recipientId === requesterId) {
      recipientId = chance.integer({ min: 1, max: 1000 });
    }
    mockFindUnique.mockResolvedValue(null);
    const fakeRequest = {
      id: chance.integer({ min: 1001, max: 2000 }),
      requester_id: requesterId,
      recipient_id: recipientId,
      status: 'pending',
    };
    mockCreate.mockResolvedValue(fakeRequest);

    const result = await friendsRequestService(requesterId, recipientId);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        requester_id: requesterId,
        recipient_id: recipientId,
        status: 'pending',
      },
    });
    expect(result).toEqual(fakeRequest);
  });

  test('should throw if a reverse request already exists between users', async () => {
    const requesterId = chance.integer({ min: 1, max: 1000 });
    let recipientId = chance.integer({ min: 1, max: 1000 });
    while (recipientId === requesterId) {
      recipientId = chance.integer({ min: 1, max: 1000 });
    }
    // Simulate no direct request, but a reverse request exists
    mockFindUnique.mockResolvedValueOnce(null); // No direct request
    // Simulate reverse request exists
    mockFindUnique.mockResolvedValueOnce({ id: chance.integer({ min: 2001, max: 3000 }), status: 'pending' });

    // Patch the service to check both directions (see below)
    await expect(friendsRequestService(requesterId, recipientId)).rejects.toThrow('Friend request already exists');
  });

  test('should allow a new request if reverse request was denied', async () => {
    const requesterId = chance.integer({ min: 1, max: 1000 });
    let recipientId = chance.integer({ min: 1, max: 1000 });
    while (recipientId === requesterId) {
      recipientId = chance.integer({ min: 1, max: 1000 });
    }
    mockFindUnique.mockResolvedValueOnce(null); // No direct request
    mockFindUnique.mockResolvedValueOnce({ id: chance.integer({ min: 2001, max: 3000 }), status: 'denied' }); // Reverse denied

    const fakeRequest = {
      id: chance.integer({ min: 3001, max: 4000 }),
      requester_id: requesterId,
      recipient_id: recipientId,
      status: 'pending',
    };
    mockCreate.mockResolvedValue(fakeRequest);

    const result = await friendsRequestService(requesterId, recipientId);
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        requester_id: requesterId,
        recipient_id: recipientId,
        status: 'pending',
      },
    });
    expect(result).toEqual(fakeRequest);
  });

  test('should throw if a reverse request is already accepted', async () => {
    const requesterId = chance.integer({ min: 1, max: 1000 });
    let recipientId = chance.integer({ min: 1, max: 1000 });
    while (recipientId === requesterId) {
      recipientId = chance.integer({ min: 1, max: 1000 });
    }
    mockFindUnique.mockResolvedValueOnce(null); // No direct request
    mockFindUnique.mockResolvedValueOnce({ id: chance.integer({ min: 2001, max: 3000 }), status: 'accepted' }); // Reverse accepted

    await expect(friendsRequestService(requesterId, recipientId)).rejects.toThrow('Friend request already exists');
  });
});
