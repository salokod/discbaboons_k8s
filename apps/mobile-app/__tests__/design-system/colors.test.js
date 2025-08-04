/**
 * Colors Design System Tests
 * Following TDD methodology - testing the structure first
 */

describe('colors design system', () => {
  it('should export a colors object', () => {
    const { colors } = require('../../src/design-system/colors');

    expect(colors).toBeDefined();
    expect(typeof colors).toBe('object');
  });

  it('should have primary brand color', () => {
    const { colors } = require('../../src/design-system/colors');

    expect(colors.primary).toBe('#ec7032');
  });

  it('should have secondary brand color', () => {
    const { colors } = require('../../src/design-system/colors');

    expect(colors.secondary).toBe('#1d1d41');
  });

  it('should have semantic colors', () => {
    const { colors } = require('../../src/design-system/colors');

    expect(colors.success).toBe('#4CAF50');
    expect(colors.error).toBe('#D32F2F');
    expect(colors.warning).toBe('#F57C00');
    expect(colors.info).toBe('#0288D1');
  });

  it('should have neutral and text colors', () => {
    const { colors } = require('../../src/design-system/colors');

    expect(colors.background).toBe('#FFFFFF');
    expect(colors.surface).toBe('#F5F5F5');
    expect(colors.text).toBe('#212121');
    expect(colors.textLight).toBe('#757575');
    expect(colors.border).toBe('#E0E0E0');
  });
});
