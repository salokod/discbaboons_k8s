import { themes, THEME_NAMES } from '../../src/design-system/themes';

describe('Themes', () => {
  it('should export themes object', () => {
    expect(themes).toBeDefined();
    expect(typeof themes).toBe('object');
  });

  it('should define theme name constants', () => {
    expect(THEME_NAMES.LIGHT).toBe('light');
    expect(THEME_NAMES.DARK).toBe('dark');
    expect(THEME_NAMES.BLACKOUT).toBe('blackout');
  });

  it('should have light, dark, and blackout themes', () => {
    expect(themes[THEME_NAMES.LIGHT]).toBeDefined();
    expect(themes[THEME_NAMES.DARK]).toBeDefined();
    expect(themes[THEME_NAMES.BLACKOUT]).toBeDefined();
  });

  it('should have consistent brand colors across all themes', () => {
    // Primary (orange) stays same across all themes
    expect(themes[THEME_NAMES.LIGHT].primary).toBe('#ec7032');
    expect(themes[THEME_NAMES.DARK].primary).toBe('#ec7032');
    expect(themes[THEME_NAMES.BLACKOUT].primary).toBe('#ec7032');

    // Secondary (dark blue) stays same across all themes
    expect(themes[THEME_NAMES.LIGHT].secondary).toBe('#1d1d41');
    expect(themes[THEME_NAMES.DARK].secondary).toBe('#1d1d41');
    expect(themes[THEME_NAMES.BLACKOUT].secondary).toBe('#1d1d41');
  });

  it('should have theme-specific background colors', () => {
    expect(themes[THEME_NAMES.LIGHT].background).toBe('#FFFFFF');
    expect(themes[THEME_NAMES.DARK].background).toBe('#121212');
    expect(themes[THEME_NAMES.BLACKOUT].background).toBe('#000000');
  });

  it('should have theme-specific text colors', () => {
    expect(themes[THEME_NAMES.LIGHT].text).toBe('#212121');
    expect(themes[THEME_NAMES.DARK].text).toBe('#FFFFFF');
    expect(themes[THEME_NAMES.BLACKOUT].text).toBe('#FFFFFF');
  });

  it('should have theme-specific surface colors', () => {
    expect(themes[THEME_NAMES.LIGHT].surface).toBe('#F5F5F5');
    expect(themes[THEME_NAMES.DARK].surface).toBe('#1E1E1E');
    expect(themes[THEME_NAMES.BLACKOUT].surface).toBe('#000000');
  });

  it('should have theme-specific border colors', () => {
    expect(themes[THEME_NAMES.LIGHT].border).toBe('#E0E0E0');
    expect(themes[THEME_NAMES.DARK].border).toBe('#424242');
    expect(themes[THEME_NAMES.BLACKOUT].border).toBe('#FFFFFF');
  });

  it('should have semantic colors for light and dark themes', () => {
    // Light and dark themes use regular semantic colors
    expect(themes[THEME_NAMES.LIGHT].success).toBe('#4CAF50');
    expect(themes[THEME_NAMES.LIGHT].error).toBe('#D32F2F');
    expect(themes[THEME_NAMES.LIGHT].warning).toBe('#F57C00');
    expect(themes[THEME_NAMES.LIGHT].info).toBe('#0288D1');

    expect(themes[THEME_NAMES.DARK].success).toBe('#4CAF50');
    expect(themes[THEME_NAMES.DARK].error).toBe('#D32F2F');
    expect(themes[THEME_NAMES.DARK].warning).toBe('#F57C00');
    expect(themes[THEME_NAMES.DARK].info).toBe('#0288D1');
  });

  it('should use white for all semantic colors in blackout theme', () => {
    // Blackout theme uses white for all semantic colors
    expect(themes[THEME_NAMES.BLACKOUT].success).toBe('#FFFFFF');
    expect(themes[THEME_NAMES.BLACKOUT].error).toBe('#FFFFFF');
    expect(themes[THEME_NAMES.BLACKOUT].warning).toBe('#FFFFFF');
    expect(themes[THEME_NAMES.BLACKOUT].info).toBe('#FFFFFF');
  });
});
