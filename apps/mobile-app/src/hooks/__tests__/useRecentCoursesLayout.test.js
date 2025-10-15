/**
 * useRecentCoursesLayout Hook Tests
 */

import { renderHook } from '@testing-library/react-native';
import { useRecentCoursesLayout } from '../useRecentCoursesLayout';
import { spacing } from '../../design-system/spacing';

describe('useRecentCoursesLayout', () => {
  it('should export useRecentCoursesLayout hook', () => {
    expect(typeof useRecentCoursesLayout).toBe('function');
  });

  it('should return layout object with required properties', () => {
    const { result } = renderHook(() => useRecentCoursesLayout());

    // Verify all required properties exist
    expect(result.current).toHaveProperty('cardWidth');
    expect(result.current).toHaveProperty('cardHeight');
    expect(result.current).toHaveProperty('gap');
    expect(result.current).toHaveProperty('horizontalPadding');
    expect(result.current).toHaveProperty('badgeSize');
    expect(result.current).toHaveProperty('nameFontSize');
    expect(result.current).toHaveProperty('cityFontSize');
    expect(result.current).toHaveProperty('timeFontSize');
  });

  it('should return valid numeric values for all layout properties', () => {
    const { result } = renderHook(() => useRecentCoursesLayout());

    expect(typeof result.current.cardWidth).toBe('number');
    expect(typeof result.current.cardHeight).toBe('number');
    expect(typeof result.current.gap).toBe('number');
    expect(typeof result.current.horizontalPadding).toBe('number');
    expect(typeof result.current.badgeSize).toBe('number');
    expect(typeof result.current.nameFontSize).toBe('number');
    expect(typeof result.current.cityFontSize).toBe('number');
    expect(typeof result.current.timeFontSize).toBe('number');
  });

  it('should return card dimensions between 96-112px', () => {
    const { result } = renderHook(() => useRecentCoursesLayout());

    expect(result.current.cardWidth).toBeGreaterThanOrEqual(96);
    expect(result.current.cardWidth).toBeLessThanOrEqual(112);
    expect(result.current.cardHeight).toBeGreaterThanOrEqual(96);
    expect(result.current.cardHeight).toBeLessThanOrEqual(112);
  });

  it('should use design system spacing values', () => {
    const { result } = renderHook(() => useRecentCoursesLayout());

    // horizontalPadding should be spacing.md (16px)
    expect(result.current.horizontalPadding).toBe(spacing.md);
  });
});
