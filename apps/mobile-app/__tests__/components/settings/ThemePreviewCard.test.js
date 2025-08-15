/**
 * ThemePreviewCard Component Tests
 */

import { render, screen } from '@testing-library/react-native';
import ThemePreviewCard from '../../../src/components/settings/ThemePreviewCard';
import { THEME_NAMES } from '../../../src/design-system/themes';

describe('ThemePreviewCard', () => {
  it('should export a component', () => {
    expect(ThemePreviewCard).toBeDefined();
    expect(typeof ThemePreviewCard).toBe('object'); // memo returns an object
  });

  it('should render with a theme prop', () => {
    render(<ThemePreviewCard theme={THEME_NAMES.LIGHT} />);

    expect(screen.getByTestId('theme-preview-card')).toBeTruthy();
  });

  it('should display theme preview elements', () => {
    render(<ThemePreviewCard theme={THEME_NAMES.LIGHT} />);

    expect(screen.getByTestId('preview-background')).toBeTruthy();
    expect(screen.getByTestId('preview-surface')).toBeTruthy();
    expect(screen.getByTestId('preview-primary')).toBeTruthy();
  });

  it('should work with different themes', () => {
    const { rerender } = render(<ThemePreviewCard theme={THEME_NAMES.LIGHT} />);
    expect(screen.getByTestId('theme-preview-card')).toBeTruthy();

    rerender(<ThemePreviewCard theme={THEME_NAMES.DARK} />);
    expect(screen.getByTestId('theme-preview-card')).toBeTruthy();

    rerender(<ThemePreviewCard theme={THEME_NAMES.BLACKOUT} />);
    expect(screen.getByTestId('theme-preview-card')).toBeTruthy();
  });
});
