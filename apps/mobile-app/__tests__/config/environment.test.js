/**
 * Environment Configuration Tests
 */

/* eslint-disable no-underscore-dangle */

describe('Environment Configuration', () => {
  const originalDEV = global.__DEV__;

  afterEach(() => {
    global.__DEV__ = originalDEV;
  });

  it('should export development configuration when __DEV__ is true', () => {
    global.__DEV__ = true;

    // Clear all module caches to get fresh import
    jest.resetModules();
    const { API_BASE_URL, LOG_LEVEL, CURRENT_ENV } = require('../../src/config/environment');

    expect(API_BASE_URL).toBe('http://localhost:8080');
    expect(LOG_LEVEL).toBe('debug');
    expect(CURRENT_ENV).toBe('development');
  });

  it('should export production configuration when __DEV__ is false', () => {
    global.__DEV__ = false;

    // Clear all module caches to get fresh import
    jest.resetModules();
    const { API_BASE_URL, LOG_LEVEL, CURRENT_ENV } = require('../../src/config/environment');

    expect(API_BASE_URL).toBe('https://discbaboons.spirojohn.com');
    expect(LOG_LEVEL).toBe('warn');
    expect(CURRENT_ENV).toBe('production');
  });

  it('should have both development and production configs available', () => {
    const { config } = require('../../src/config/environment');

    expect(config.development).toEqual({
      API_BASE_URL: 'http://localhost:8080',
      LOG_LEVEL: 'debug',
    });

    expect(config.production).toEqual({
      API_BASE_URL: 'https://discbaboons.spirojohn.com',
      LOG_LEVEL: 'warn',
    });
  });
});
