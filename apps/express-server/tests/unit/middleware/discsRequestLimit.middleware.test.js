import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import discsRequestLimit from '../../../middleware/discsRequestLimit.middleware.js';

describe('discsRequestLimit middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  it('should export a function', () => {
    expect(typeof discsRequestLimit).toBe('function');
  });

  it('should call next() for requests under 5KB', () => {
    req.headers['content-length'] = '4096'; // 4KB

    discsRequestLimit(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should reject requests over 5KB with 413 status', () => {
    req.headers['content-length'] = '6144'; // 6KB

    discsRequestLimit(req, res, next);

    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Request payload too large. Maximum size is 5KB.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should allow requests exactly at 5KB limit', () => {
    req.headers['content-length'] = '5120'; // Exactly 5KB

    discsRequestLimit(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should allow requests with no content-length header', () => {
    // No content-length header

    discsRequestLimit(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should handle invalid content-length header', () => {
    req.headers['content-length'] = 'invalid';

    discsRequestLimit(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
