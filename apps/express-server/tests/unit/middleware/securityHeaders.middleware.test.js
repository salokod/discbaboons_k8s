import {
  describe, it, expect, vi,
} from 'vitest';
import Chance from 'chance';

const chance = new Chance();

describe('securityHeaders middleware', () => {
  it('should export securityHeaders function', async () => {
    const securityHeaders = await import('../../../middleware/securityHeaders.middleware.js');
    expect(typeof securityHeaders.default).toBe('function');
  });

  it('should have proper middleware signature', async () => {
    const securityHeaders = await import('../../../middleware/securityHeaders.middleware.js');
    expect(securityHeaders.default.length).toBe(3); // req, res, next
  });

  it('should set all required security headers', async () => {
    const securityHeaders = await import('../../../middleware/securityHeaders.middleware.js');

    const mockReq = { headers: {} };
    const mockRes = {
      setHeader: vi.fn(),
      removeHeader: vi.fn(),
    };
    const mockNext = vi.fn();

    securityHeaders.default(mockReq, mockRes, mockNext);

    // Verify all security headers are set
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
    expect(mockRes.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
    expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache, must-revalidate, private');
    expect(mockRes.setHeader).toHaveBeenCalledWith('Pragma', 'no-cache');
    expect(mockRes.setHeader).toHaveBeenCalledWith('Expires', '0');
    expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    expect(mockRes.setHeader).toHaveBeenCalledWith('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  });

  it('should remove server information headers', async () => {
    const securityHeaders = await import('../../../middleware/securityHeaders.middleware.js');

    const mockReq = { headers: {} };
    const mockRes = {
      setHeader: vi.fn(),
      removeHeader: vi.fn(),
    };
    const mockNext = vi.fn();

    securityHeaders.default(mockReq, mockRes, mockNext);

    expect(mockRes.removeHeader).toHaveBeenCalledWith('X-Powered-By');
    expect(mockRes.removeHeader).toHaveBeenCalledWith('Server');
  });

  it('should call next() to continue middleware chain', async () => {
    const securityHeaders = await import('../../../middleware/securityHeaders.middleware.js');

    const mockReq = {};
    const mockRes = {
      setHeader: vi.fn(),
      removeHeader: vi.fn(),
    };
    const mockNext = vi.fn();

    securityHeaders.default(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('should set appropriate cache control headers for auth endpoints', async () => {
    const securityHeaders = await import('../../../middleware/securityHeaders.middleware.js');

    const mockReq = {};
    const mockRes = {
      setHeader: vi.fn(),
      removeHeader: vi.fn(),
    };
    const mockNext = vi.fn();

    securityHeaders.default(mockReq, mockRes, mockNext);

    // Verify cache control is set but not overly restrictive (no-store removed)
    expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache, must-revalidate, private');
    expect(mockRes.setHeader).not.toHaveBeenCalledWith('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  });

  it('should set security headers that prevent common attacks', async () => {
    const securityHeaders = await import('../../../middleware/securityHeaders.middleware.js');

    const mockReq = {};
    const mockRes = {
      setHeader: vi.fn(),
      removeHeader: vi.fn(),
    };
    const mockNext = vi.fn();

    securityHeaders.default(mockReq, mockRes, mockNext);

    // Verify specific security protections
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff'); // MIME sniffing protection
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY'); // Clickjacking protection
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block'); // XSS protection
    expect(mockRes.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin'); // Referrer leakage protection
  });

  it('should be a pure function with no side effects', async () => {
    const securityHeaders = await import('../../../middleware/securityHeaders.middleware.js');

    const mockReq1 = {};
    const mockRes1 = {
      setHeader: vi.fn(),
      removeHeader: vi.fn(),
    };
    const mockNext1 = vi.fn();

    const mockReq2 = {};
    const mockRes2 = {
      setHeader: vi.fn(),
      removeHeader: vi.fn(),
    };
    const mockNext2 = vi.fn();

    // Call middleware twice with different objects
    securityHeaders.default(mockReq1, mockRes1, mockNext1);
    securityHeaders.default(mockReq2, mockRes2, mockNext2);

    // Both should behave identically (now 9 headers + X-Request-ID)
    expect(mockRes1.setHeader).toHaveBeenCalledTimes(10);
    expect(mockRes2.setHeader).toHaveBeenCalledTimes(10);
    expect(mockNext1).toHaveBeenCalledTimes(1);
    expect(mockNext2).toHaveBeenCalledTimes(1);
  });

  it('should generate X-Request-ID when not provided', async () => {
    const securityHeaders = await import('../../../middleware/securityHeaders.middleware.js');

    const mockReq = { headers: {} };
    const mockRes = {
      setHeader: vi.fn(),
      removeHeader: vi.fn(),
    };
    const mockNext = vi.fn();

    securityHeaders.default(mockReq, mockRes, mockNext);

    // Verify X-Request-ID was generated
    const requestIdCall = mockRes.setHeader.mock.calls.find((call) => call[0] === 'X-Request-ID');
    expect(requestIdCall).toBeDefined();
    expect(requestIdCall[1]).toMatch(/^auth-\d+-[a-z0-9]+$/);
  });

  it('should use existing X-Request-ID when provided', async () => {
    const securityHeaders = await import('../../../middleware/securityHeaders.middleware.js');

    const existingRequestId = chance.guid();
    const mockReq = { headers: { 'x-request-id': existingRequestId } };
    const mockRes = {
      setHeader: vi.fn(),
      removeHeader: vi.fn(),
    };
    const mockNext = vi.fn();

    securityHeaders.default(mockReq, mockRes, mockNext);

    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-ID', existingRequestId);
  });

  it('should set enhanced CSP and Permissions Policy headers', async () => {
    const securityHeaders = await import('../../../middleware/securityHeaders.middleware.js');

    const mockReq = { headers: {} };
    const mockRes = {
      setHeader: vi.fn(),
      removeHeader: vi.fn(),
    };
    const mockNext = vi.fn();

    securityHeaders.default(mockReq, mockRes, mockNext);

    // Verify enhanced security headers
    expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    expect(mockRes.setHeader).toHaveBeenCalledWith('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  });
});
