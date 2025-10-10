import {
  spacing, shadows, animation, borderRadius,
} from '../../src/design-system/tokens';

describe('Design System Tokens', () => {
  describe('spacing', () => {
    it('should export spacing constants on 8pt grid', () => {
      expect(spacing.xs).toBe(4);
      expect(spacing.sm).toBe(8);
      expect(spacing.md).toBe(12);
      expect(spacing.lg).toBe(16);
      expect(spacing.xl).toBe(20);
      expect(spacing.xxl).toBe(24);
    });

    it('should have all spacing values as multiples of 4', () => {
      Object.values(spacing).forEach((value) => {
        expect(value % 4).toBe(0);
      });
    });
  });

  describe('shadows', () => {
    it('should export small shadow preset', () => {
      expect(shadows.sm).toEqual({
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.18,
        shadowRadius: 1.0,
      });
    });

    it('should export medium shadow preset', () => {
      expect(shadows.md).toEqual({
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
      });
    });

    it('should use #000 shadowColor for both presets', () => {
      expect(shadows.sm.shadowColor).toBe('#000');
      expect(shadows.md.shadowColor).toBe('#000');
    });
  });

  describe('animation', () => {
    it('should export animation timing constants', () => {
      expect(animation.fast).toBe(150);
      expect(animation.normal).toBe(250);
      expect(animation.slow).toBe(400);
    });

    it('should have timings in ascending order', () => {
      expect(animation.fast).toBeLessThan(animation.normal);
      expect(animation.normal).toBeLessThan(animation.slow);
    });
  });

  describe('borderRadius', () => {
    it('should export borderRadius constants', () => {
      expect(borderRadius.sm).toBe(4);
      expect(borderRadius.md).toBe(8);
      expect(borderRadius.lg).toBe(12);
      expect(borderRadius.xl).toBe(16);
    });

    it('should have all borderRadius values as multiples of 4', () => {
      Object.values(borderRadius).forEach((value) => {
        expect(value % 4).toBe(0);
      });
    });
  });
});
