/**
 * Password Reset Flow Integration Tests
 * Tests the complete forgot password → reset password user journey
 */

import { forgotPassword, resetPassword, resendPasswordResetCode } from '../../src/services/authService';

// Mock fetch for integration tests
global.fetch = jest.fn();

describe('Password Reset Flow Integration Tests', () => {
  beforeEach(() => {
    fetch.mockClear();
    jest.clearAllMocks();
  });

  describe('Complete Password Reset User Journey', () => {
    const testEmail = 'user@example.com';
    const verificationCode = 'ABC123';
    const newPassword = 'NewPassword123!';

    it('should complete full password reset flow successfully', async () => {
      // Step 1: User requests password reset
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Reset instructions sent to your email',
        }),
      });

      const forgotResponse = await forgotPassword(testEmail);
      expect(forgotResponse.message).toBe('Reset instructions sent to your email');

      // Verify correct API endpoint is called
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/forgot-password'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: testEmail }),
        }),
      );

      // Step 2: User receives email and resets password
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'Password reset successful',
        }),
      });

      const resetResponse = await resetPassword(verificationCode, newPassword, testEmail);
      expect(resetResponse.message).toBe('Password reset successful');

      // Verify correct API endpoint and payload
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/change-password'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resetCode: verificationCode,
            newPassword,
            email: testEmail,
          }),
        }),
      );
    });

    it('should handle resend code functionality', async () => {
      // User requests resend of verification code
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: 'New verification code sent',
        }),
      });

      const resendResponse = await resendPasswordResetCode(testEmail);
      expect(resendResponse.message).toBe('New verification code sent');

      // Verify it uses the same endpoint as forgot password
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/forgot-password'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: testEmail }),
        }),
      );
    });
  });

  describe('Input Validation Integration', () => {
    it('should validate hexadecimal verification codes', () => {
      // Test valid hexadecimal codes
      const validCodes = ['ABC123', 'DEF456', '123ABC', '000FFF'];
      validCodes.forEach((code) => {
        const cleaned = code.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
        expect(cleaned).toBe(code);
        expect(cleaned).toMatch(/^[0-9A-F]{6}$/);
      });

      // Test invalid characters are filtered
      const invalidInput = 'AB$C1@23XYZ';
      const cleaned = invalidInput.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
      expect(cleaned).toBe('ABC123');
    });

    it('should validate verification code length', async () => {
      // Test code too short
      await expect(resetPassword('ABC12', 'NewPassword123!', 'user@example.com'))
        .rejects.toThrow('Valid 6-digit verification code is required');

      // Test code too long
      await expect(resetPassword('ABC1234', 'NewPassword123!', 'user@example.com'))
        .rejects.toThrow('Valid 6-digit verification code is required');

      // Test empty code
      await expect(resetPassword('', 'NewPassword123!', 'user@example.com'))
        .rejects.toThrow('Valid 6-digit verification code is required');
    });

    it('should validate password requirements', async () => {
      // Test password too short
      await expect(resetPassword('ABC123', 'short', 'user@example.com'))
        .rejects.toThrow('Password must be at least 8 characters long');

      // Test empty password
      await expect(resetPassword('ABC123', '', 'user@example.com'))
        .rejects.toThrow('Password must be at least 8 characters long');
    });

    it('should validate email/username requirement', async () => {
      // Test empty email
      await expect(resetPassword('ABC123', 'NewPassword123!', ''))
        .rejects.toThrow('Username or email is required');

      // Test null email
      await expect(resetPassword('ABC123', 'NewPassword123!', null))
        .rejects.toThrow('Username or email is required');
    });

    it('should validate email format integration', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.co.uk',
        'user+label@example.org',
      ];

      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user.example.com',
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      validEmails.forEach((email) => {
        expect(emailRegex.test(email)).toBe(true);
      });

      invalidEmails.forEach((email) => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });

  describe('API Contract Integration Tests', () => {
    it('should send correct request structure for forgot password', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, message: 'Success' }),
      });

      await forgotPassword('user@example.com');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/forgot-password'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ email: 'user@example.com' }),
          signal: expect.any(AbortSignal),
        }),
      );
    });

    it('should send correct request structure for reset password', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, message: 'Success' }),
      });

      await resetPassword('ABC123', 'NewPassword123!', 'user@example.com');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/change-password'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            resetCode: 'ABC123',
            newPassword: 'NewPassword123!',
            email: 'user@example.com',
          }),
          signal: expect.any(AbortSignal),
        }),
      );
    });

    it('should handle username vs email detection in reset password', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, message: 'Success' }),
      });

      // Test with username (no @ symbol)
      await resetPassword('ABC123', 'NewPassword123!', 'testuser');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/change-password'),
        expect.objectContaining({
          body: JSON.stringify({
            resetCode: 'ABC123',
            newPassword: 'NewPassword123!',
            username: 'testuser',
          }),
        }),
      );
    });
  });

  describe('Security Integration Tests', () => {
    it('should include AbortSignal for request timeout', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, message: 'Success' }),
      });

      await forgotPassword('user@example.com');

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      );
    });

    it('should trim input data for security', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, message: 'Success' }),
      });

      // Test with whitespace
      await forgotPassword('  user@example.com  ');

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ email: 'user@example.com' }),
        }),
      );
    });

    it('should handle verification code trimming', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, message: 'Success' }),
      });

      // Test with whitespace in verification code
      await resetPassword('  ABC123  ', 'NewPassword123!', 'user@example.com');

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            resetCode: 'ABC123',
            newPassword: 'NewPassword123!',
            email: 'user@example.com',
          }),
        }),
      );
    });
  });
});
