import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import bagsRequestLimit from '../../../middleware/bagsRequestLimit.middleware.js';

describe('bagsRequestLimit middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      headers: {
        'content-length': '1024', // 1KB
      },
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  it('should export a function', () => {
    expect(typeof bagsRequestLimit).toBe('function');
  });

  it('should call next() for requests under size limit', () => {
    req.headers['content-length'] = '1024'; // 1KB - under 50KB limit
    bagsRequestLimit(req, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should call next() when content-length header is missing', () => {
    delete req.headers['content-length'];
    bagsRequestLimit(req, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 413 for requests over size limit', () => {
    req.headers['content-length'] = '52428800'; // 50MB - over 50KB limit
    bagsRequestLimit(req, res, next);
    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Request payload too large. Maximum size is 50KB.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle invalid content-length header gracefully', () => {
    req.headers['content-length'] = 'invalid';
    bagsRequestLimit(req, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });
});
