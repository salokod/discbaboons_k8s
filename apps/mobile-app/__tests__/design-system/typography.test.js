/**
 * Typography Design System Tests
 */

describe('typography design system', () => {
  it('should export a typography object', () => {
    const { typography } = require('../../src/design-system/typography');

    expect(typography).toBeDefined();
    expect(typeof typography).toBe('object');
  });

  it('should have text styles', () => {
    const { typography } = require('../../src/design-system/typography');

    expect(typography.h1).toEqual({ fontSize: 32, fontWeight: 'bold' });
    expect(typography.h2).toEqual({ fontSize: 24, fontWeight: 'bold' });
    expect(typography.body).toEqual({ fontSize: 16, fontWeight: 'normal' });
    expect(typography.caption).toEqual({ fontSize: 12, fontWeight: 'normal' });
  });
});
