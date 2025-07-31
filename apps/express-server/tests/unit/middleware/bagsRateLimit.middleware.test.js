import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import {
  bagsListRateLimit,
  bagsCreateRateLimit,
  bagsUpdateRateLimit,
  bagsDeleteRateLimit,
  bagsBulkRateLimit,
} from '../../../middleware/bagsRateLimit.middleware.js';

describe('bagsRateLimit middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    req = {
      ip: '127.0.0.1',
      headers: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      set: vi.fn(),
    };
    next = vi.fn();
  });

  describe('bagsListRateLimit', () => {
    it('should export a function', () => {
      expect(typeof bagsListRateLimit).toBe('function');
    });

    it('should call next() on first request', async () => {
      await bagsListRateLimit(req, res, next);
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('bagsCreateRateLimit', () => {
    it('should export a function', () => {
      expect(typeof bagsCreateRateLimit).toBe('function');
    });

    it('should call next() on first request', async () => {
      await bagsCreateRateLimit(req, res, next);
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('bagsUpdateRateLimit', () => {
    it('should export a function', () => {
      expect(typeof bagsUpdateRateLimit).toBe('function');
    });

    it('should call next() on first request', async () => {
      await bagsUpdateRateLimit(req, res, next);
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('bagsDeleteRateLimit', () => {
    it('should export a function', () => {
      expect(typeof bagsDeleteRateLimit).toBe('function');
    });

    it('should call next() on first request', async () => {
      await bagsDeleteRateLimit(req, res, next);
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('bagsBulkRateLimit', () => {
    it('should export a function', () => {
      expect(typeof bagsBulkRateLimit).toBe('function');
    });

    it('should call next() on first request', async () => {
      await bagsBulkRateLimit(req, res, next);
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
