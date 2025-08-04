/**
 * Spacing Design System Tests
 */

describe('spacing design system', () => {
  it('should export a spacing object', () => {
    const { spacing } = require('../../src/design-system/spacing');

    expect(spacing).toBeDefined();
    expect(typeof spacing).toBe('object');
  });

  it('should have spacing values', () => {
    const { spacing } = require('../../src/design-system/spacing');

    expect(spacing.xs).toBe(4);
    expect(spacing.sm).toBe(8);
    expect(spacing.md).toBe(16);
    expect(spacing.lg).toBe(24);
    expect(spacing.xl).toBe(32);
  });
});
