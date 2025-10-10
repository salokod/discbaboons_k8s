/**
 * OfflineQueue Service Tests
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addToQueue, processQueue, clearQueue, getQueueSize,
} from '../offlineQueue';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('OfflineQueue Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
    AsyncStorage.setItem.mockResolvedValue();
    AsyncStorage.removeItem.mockResolvedValue();
  });

  describe('addToQueue', () => {
    it('should export addToQueue function', () => {
      expect(addToQueue).toBeDefined();
      expect(typeof addToQueue).toBe('function');
    });

    it('should add operation to empty queue', async () => {
      const operation = {
        type: 'SUBMIT_SCORES',
        data: { roundId: 'round-123', scores: [] },
      };

      await addToQueue(operation);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@offline_queue',
        expect.stringContaining('SUBMIT_SCORES'),
      );
    });

    it('should add operation with auto-generated id', async () => {
      const operation = {
        type: 'SUBMIT_SCORES',
        data: { roundId: 'round-123', scores: [] },
      };

      await addToQueue(operation);

      const savedData = AsyncStorage.setItem.mock.calls[0][1];
      const queue = JSON.parse(savedData);

      expect(queue).toHaveLength(1);
      expect(queue[0]).toHaveProperty('id');
      expect(queue[0]).toHaveProperty('timestamp');
      expect(queue[0].retries).toBe(0);
    });

    it('should add operation to existing queue', async () => {
      const existingQueue = [
        {
          id: 'op-1',
          type: 'SUBMIT_SCORES',
          data: {},
          timestamp: Date.now(),
          retries: 0,
        },
      ];

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingQueue));

      const operation = {
        type: 'SUBMIT_SCORES',
        data: { roundId: 'round-456', scores: [] },
      };

      await addToQueue(operation);

      const savedData = AsyncStorage.setItem.mock.calls[0][1];
      const queue = JSON.parse(savedData);

      expect(queue).toHaveLength(2);
      expect(queue[0].id).toBe('op-1');
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      AsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

      const operation = {
        type: 'SUBMIT_SCORES',
        data: {},
      };

      await expect(addToQueue(operation)).rejects.toThrow('Storage error');
    });
  });

  describe('processQueue', () => {
    it('should export processQueue function', () => {
      expect(processQueue).toBeDefined();
      expect(typeof processQueue).toBe('function');
    });

    it('should process empty queue', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      const result = await processQueue();

      expect(result).toEqual({ processed: 0, failed: 0 });
    });

    it('should process operations with provided handler', async () => {
      const queue = [
        {
          id: 'op-1',
          type: 'SUBMIT_SCORES',
          data: { roundId: 'round-123' },
          timestamp: Date.now(),
          retries: 0,
        },
      ];

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(queue));

      const handler = jest.fn().mockResolvedValue({ success: true });

      const result = await processQueue(handler);

      expect(handler).toHaveBeenCalledWith(queue[0]);
      expect(result.processed).toBe(1);
      expect(result.failed).toBe(0);
    });

    it('should remove successful operations from queue', async () => {
      const queue = [
        {
          id: 'op-1',
          type: 'SUBMIT_SCORES',
          data: { roundId: 'round-123' },
          timestamp: Date.now(),
          retries: 0,
        },
      ];

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(queue));

      const handler = jest.fn().mockResolvedValue({ success: true });

      await processQueue(handler);

      const savedData = AsyncStorage.setItem.mock.calls[0][1];
      const updatedQueue = JSON.parse(savedData);

      expect(updatedQueue).toHaveLength(0);
    });

    it('should keep failed operations in queue', async () => {
      const queue = [
        {
          id: 'op-1',
          type: 'SUBMIT_SCORES',
          data: { roundId: 'round-123' },
          timestamp: Date.now(),
          retries: 0,
        },
      ];

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(queue));

      const handler = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await processQueue(handler);

      expect(result.processed).toBe(0);
      expect(result.failed).toBe(1);

      const savedData = AsyncStorage.setItem.mock.calls[0][1];
      const updatedQueue = JSON.parse(savedData);

      expect(updatedQueue).toHaveLength(1);
      expect(updatedQueue[0].retries).toBe(1);
    });

    it('should remove operations after max retries', async () => {
      const queue = [
        {
          id: 'op-1',
          type: 'SUBMIT_SCORES',
          data: { roundId: 'round-123' },
          timestamp: Date.now(),
          retries: 3, // Max retries
        },
      ];

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(queue));

      const handler = jest.fn().mockRejectedValue(new Error('Network error'));

      await processQueue(handler);

      const savedData = AsyncStorage.setItem.mock.calls[0][1];
      const updatedQueue = JSON.parse(savedData);

      expect(updatedQueue).toHaveLength(0);
    });

    it('should handle multiple operations', async () => {
      const queue = [
        {
          id: 'op-1',
          type: 'SUBMIT_SCORES',
          data: {},
          timestamp: Date.now(),
          retries: 0,
        },
        {
          id: 'op-2',
          type: 'SUBMIT_SCORES',
          data: {},
          timestamp: Date.now(),
          retries: 0,
        },
      ];

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(queue));

      const handler = jest.fn().mockResolvedValue({ success: true });

      const result = await processQueue(handler);

      expect(handler).toHaveBeenCalledTimes(2);
      expect(result.processed).toBe(2);
    });
  });

  describe('clearQueue', () => {
    it('should export clearQueue function', () => {
      expect(clearQueue).toBeDefined();
      expect(typeof clearQueue).toBe('function');
    });

    it('should remove queue from storage', async () => {
      await clearQueue();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@offline_queue');
    });

    it('should handle storage errors gracefully', async () => {
      AsyncStorage.removeItem.mockRejectedValue(new Error('Storage error'));

      await expect(clearQueue()).rejects.toThrow('Storage error');
    });
  });

  describe('getQueueSize', () => {
    it('should export getQueueSize function', () => {
      expect(getQueueSize).toBeDefined();
      expect(typeof getQueueSize).toBe('function');
    });

    it('should return 0 for empty queue', async () => {
      AsyncStorage.getItem.mockResolvedValue(null);

      const size = await getQueueSize();

      expect(size).toBe(0);
    });

    it('should return correct queue size', async () => {
      const queue = [
        {
          id: 'op-1', type: 'SUBMIT_SCORES', data: {}, timestamp: Date.now(), retries: 0,
        },
        {
          id: 'op-2', type: 'SUBMIT_SCORES', data: {}, timestamp: Date.now(), retries: 0,
        },
        {
          id: 'op-3', type: 'SUBMIT_SCORES', data: {}, timestamp: Date.now(), retries: 0,
        },
      ];

      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(queue));

      const size = await getQueueSize();

      expect(size).toBe(3);
    });
  });
});
