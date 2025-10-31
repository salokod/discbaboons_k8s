const networkService = require('../../src/services/networkService');

describe('networkService', () => {
  it('should export an object', () => {
    expect(typeof networkService).toBe('object');
  });

  it('should export isConnected function', () => {
    expect(typeof networkService.isConnected).toBe('function');
  });

  it('should export addEventListener function', () => {
    expect(typeof networkService.addEventListener).toBe('function');
  });

  it('should export removeEventListener function', () => {
    expect(typeof networkService.removeEventListener).toBe('function');
  });
});
