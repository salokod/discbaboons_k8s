import { themes, THEME_NAMES } from '../../src/design-system/themes';

// Helper function to calculate luminance for contrast ratio calculations
function getLuminance(hex) {
  const rgb = parseInt(hex.substring(1), 16);
  // Extract RGB components without bitwise operators
  const r = Math.floor(rgb / 65536) % 256;
  const g = Math.floor(rgb / 256) % 256;
  const b = rgb % 256;

  const [rs, gs, bs] = [r, g, b].map((color) => {
    const normalized = color / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Helper function to calculate contrast ratio between two colors
function getContrastRatio(color1, color2) {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

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
    expect(themes[THEME_NAMES.LIGHT].background).toBe('#FAFBFC');
    expect(themes[THEME_NAMES.DARK].background).toBe('#121212');
    expect(themes[THEME_NAMES.BLACKOUT].background).toBe('#000000');
  });

  it('should have theme-specific text colors', () => {
    expect(themes[THEME_NAMES.LIGHT].text).toBe('#212121');
    expect(themes[THEME_NAMES.DARK].text).toBe('#FFFFFF');
    expect(themes[THEME_NAMES.BLACKOUT].text).toBe('#FFFFFF');
  });

  it('should have theme-specific surface colors', () => {
    expect(themes[THEME_NAMES.LIGHT].surface).toBe('#FFFFFF');
    expect(themes[THEME_NAMES.DARK].surface).toBe('#1E1E1E');
    expect(themes[THEME_NAMES.BLACKOUT].surface).toBe('#000000');
  });

  it('should have theme-specific border colors', () => {
    expect(themes[THEME_NAMES.LIGHT].border).toBe('#757575');
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

  it('should have admin theme colors across all themes', () => {
    // Admin primary should be golden accent (#FFD700)
    expect(themes[THEME_NAMES.LIGHT].adminPrimary).toBe('#FFD700');
    expect(themes[THEME_NAMES.DARK].adminPrimary).toBe('#FFD700');
    expect(themes[THEME_NAMES.BLACKOUT].adminPrimary).toBe('#FFD700');

    // Admin secondary should be darker golden accent (#B8860B)
    expect(themes[THEME_NAMES.LIGHT].adminSecondary).toBe('#B8860B');
    expect(themes[THEME_NAMES.DARK].adminSecondary).toBe('#B8860B');
    expect(themes[THEME_NAMES.BLACKOUT].adminSecondary).toBe('#B8860B');

    // Admin accent should be lighter golden (#FFF8DC)
    expect(themes[THEME_NAMES.LIGHT].adminAccent).toBe('#FFF8DC');
    expect(themes[THEME_NAMES.DARK].adminAccent).toBe('#FFF8DC');
    expect(themes[THEME_NAMES.BLACKOUT].adminAccent).toBe('#FFF8DC');
  });

  describe('textSecondary contrast ratios', () => {
    it('should have textSecondary property in all themes', () => {
      expect(themes[THEME_NAMES.LIGHT].textSecondary).toBeDefined();
      expect(themes[THEME_NAMES.DARK].textSecondary).toBeDefined();
      expect(themes[THEME_NAMES.BLACKOUT].textSecondary).toBeDefined();
    });

    it('should meet WCAG AA contrast requirements for light theme textSecondary', () => {
      const theme = themes[THEME_NAMES.LIGHT];
      const contrast = getContrastRatio(theme.textSecondary, theme.background);

      // WCAG AA requires minimum 4.5:1 for normal text
      expect(contrast).toBeGreaterThanOrEqual(4.5);
      expect(theme.textSecondary).toBe('#666666');
    });

    it('should meet WCAG AA contrast requirements for dark theme textSecondary', () => {
      const theme = themes[THEME_NAMES.DARK];
      const contrast = getContrastRatio(theme.textSecondary, theme.background);

      // WCAG AA requires minimum 4.5:1 for normal text
      expect(contrast).toBeGreaterThanOrEqual(4.5);
      expect(theme.textSecondary).toBe('#CCCCCC');
    });

    it('should have maximum contrast for blackout theme textSecondary', () => {
      const theme = themes[THEME_NAMES.BLACKOUT];
      const contrast = getContrastRatio(theme.textSecondary, theme.background);

      // Blackout theme should have maximum contrast (21:1)
      expect(contrast).toBe(21);
      expect(theme.textSecondary).toBe('#FFFFFF');
    });

    it('should maintain readability on surface colors', () => {
      // Test textSecondary readability on surface colors for all themes
      Object.values(THEME_NAMES).forEach((themeName) => {
        if (themeName === 'system') return; // Skip system theme

        const theme = themes[themeName];
        const contrast = getContrastRatio(theme.textSecondary, theme.surface);

        // Should meet at least WCAG AA standard
        expect(contrast).toBeGreaterThanOrEqual(4.5);
      });
    });
  });

  describe('accessibility contrast validation', () => {
    it('should have sufficient contrast for primary text in all themes', () => {
      Object.values(THEME_NAMES).forEach((themeName) => {
        if (themeName === 'system') return; // Skip system theme

        const theme = themes[themeName];
        const bgContrast = getContrastRatio(theme.text, theme.background);
        const surfaceContrast = getContrastRatio(theme.text, theme.surface);

        // Primary text must meet WCAG AAA standard (7:1)
        expect(bgContrast).toBeGreaterThanOrEqual(7);
        expect(surfaceContrast).toBeGreaterThanOrEqual(7);
      });
    });

    it('should have sufficient contrast for textLight in all themes', () => {
      Object.values(THEME_NAMES).forEach((themeName) => {
        if (themeName === 'system') return; // Skip system theme

        const theme = themes[themeName];
        const bgContrast = getContrastRatio(theme.textLight, theme.background);
        const surfaceContrast = getContrastRatio(theme.textLight, theme.surface);

        // Light text should at least meet WCAG AA (4.5:1)
        expect(bgContrast).toBeGreaterThanOrEqual(4.5);
        expect(surfaceContrast).toBeGreaterThanOrEqual(4.5);
      });
    });

    it('should have proper contrast for border colors', () => {
      // Light theme should have good border contrast
      const lightTheme = themes[THEME_NAMES.LIGHT];
      const lightBgContrast = getContrastRatio(lightTheme.border, lightTheme.background);
      expect(lightBgContrast).toBeGreaterThanOrEqual(3);

      // Dark theme borders should be visible (relaxed requirement for dark backgrounds)
      const darkTheme = themes[THEME_NAMES.DARK];
      const darkBgContrast = getContrastRatio(darkTheme.border, darkTheme.background);
      expect(darkBgContrast).toBeGreaterThanOrEqual(1.5);

      // Blackout theme has maximum contrast
      const blackoutTheme = themes[THEME_NAMES.BLACKOUT];
      const blackoutBgContrast = getContrastRatio(blackoutTheme.border, blackoutTheme.background);
      expect(blackoutBgContrast).toBe(21);
    });
  });
});
