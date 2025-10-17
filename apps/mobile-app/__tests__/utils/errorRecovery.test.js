const { categorizeError } = require('../../src/utils/errorRecovery');

describe('errorRecovery utility', () => {
  it('should export categorizeError function', () => {
    expect(categorizeError).toBeDefined();
    expect(typeof categorizeError).toBe('function');
  });
});
