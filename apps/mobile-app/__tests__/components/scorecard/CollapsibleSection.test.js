import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import CollapsibleSection from '../../../src/components/scorecard/CollapsibleSection';
import { ThemeProvider } from '../../../src/context/ThemeContext';
import * as hapticService from '../../../src/services/hapticService';

jest.mock('../../../src/services/hapticService');

const renderWithTheme = (component) => render(
  <ThemeProvider testMode>
    {component}
  </ThemeProvider>,
);

describe('CollapsibleSection', () => {
  describe('Component structure', () => {
    it('should export a CollapsibleSection component', () => {
      expect(CollapsibleSection).toBeDefined();
      expect(typeof CollapsibleSection).toBe('function');
    });

    it('should render with title prop', () => {
      const { getByText } = renderWithTheme(
        <CollapsibleSection title="Test Title">
          <Text>Child content</Text>
        </CollapsibleSection>,
      );

      expect(getByText('Test Title')).toBeTruthy();
    });

    it('should render children when provided', () => {
      const { getByTestId } = renderWithTheme(
        <CollapsibleSection title="Test Title">
          <Text>Child content</Text>
        </CollapsibleSection>,
      );

      expect(getByTestId('collapsible-section')).toBeTruthy();
    });
  });

  describe('Expand/collapse state', () => {
    it('should start collapsed by default', () => {
      const { queryByText } = renderWithTheme(
        <CollapsibleSection title="Test Title">
          <Text>Child content</Text>
        </CollapsibleSection>,
      );

      // Content should not be visible when collapsed
      expect(queryByText('Child content')).toBeNull();
    });

    it('should expand when header is pressed', () => {
      const { getByTestId, getByText } = renderWithTheme(
        <CollapsibleSection title="Test Title">
          <Text>Child content</Text>
        </CollapsibleSection>,
      );

      const header = getByTestId('collapsible-header');
      fireEvent.press(header);

      // Content should be visible after pressing header
      expect(getByText('Child content')).toBeTruthy();
    });

    it('should collapse when header is pressed again', () => {
      const { getByTestId, queryByText, getByText } = renderWithTheme(
        <CollapsibleSection title="Test Title">
          <Text>Child content</Text>
        </CollapsibleSection>,
      );

      const header = getByTestId('collapsible-header');

      // Expand
      fireEvent.press(header);
      expect(getByText('Child content')).toBeTruthy();

      // Collapse
      fireEvent.press(header);
      expect(queryByText('Child content')).toBeNull();
    });
  });

  describe('Chevron icon indicator', () => {
    it('should render chevron icon', () => {
      const { getByTestId } = renderWithTheme(
        <CollapsibleSection title="Test Title">
          <Text>Child content</Text>
        </CollapsibleSection>,
      );

      expect(getByTestId('chevron-icon')).toBeTruthy();
    });

    it('should have chevron pointing down when collapsed', () => {
      const { getByTestId } = renderWithTheme(
        <CollapsibleSection title="Test Title">
          <Text>Child content</Text>
        </CollapsibleSection>,
      );

      const chevron = getByTestId('chevron-icon');
      // Chevron should point down (chevron-down) when collapsed
      expect(chevron.props.children).toBe('▼');
    });

    it('should have chevron pointing up when expanded', () => {
      const { getByTestId } = renderWithTheme(
        <CollapsibleSection title="Test Title">
          <Text>Child content</Text>
        </CollapsibleSection>,
      );

      const header = getByTestId('collapsible-header');
      fireEvent.press(header);

      const chevron = getByTestId('chevron-icon');
      // Chevron should point up (chevron-up) when expanded
      expect(chevron.props.children).toBe('▲');
    });
  });

  describe('Accessibility', () => {
    it('should have accessibility role on header', () => {
      const { getByTestId } = renderWithTheme(
        <CollapsibleSection title="Test Title">
          <Text>Child content</Text>
        </CollapsibleSection>,
      );

      const header = getByTestId('collapsible-header');
      expect(header.props.accessibilityRole).toBe('button');
    });

    it('should have accessibility label on header', () => {
      const { getByTestId } = renderWithTheme(
        <CollapsibleSection title="Test Title">
          <Text>Child content</Text>
        </CollapsibleSection>,
      );

      const header = getByTestId('collapsible-header');
      expect(header.props.accessibilityLabel).toBe('Test Title section');
    });

    it('should have accessibility state for collapsed', () => {
      const { getByTestId } = renderWithTheme(
        <CollapsibleSection title="Test Title">
          <Text>Child content</Text>
        </CollapsibleSection>,
      );

      const header = getByTestId('collapsible-header');
      expect(header.props.accessibilityState).toEqual({ expanded: false });
    });

    it('should have accessibility state for expanded', () => {
      const { getByTestId } = renderWithTheme(
        <CollapsibleSection title="Test Title">
          <Text>Child content</Text>
        </CollapsibleSection>,
      );

      const header = getByTestId('collapsible-header');
      fireEvent.press(header);

      expect(header.props.accessibilityState).toEqual({ expanded: true });
    });

    it('should have accessibility hint', () => {
      const { getByTestId } = renderWithTheme(
        <CollapsibleSection title="Test Title">
          <Text>Child content</Text>
        </CollapsibleSection>,
      );

      const header = getByTestId('collapsible-header');
      expect(header.props.accessibilityHint).toBe('Double tap to expand or collapse');
    });
  });

  describe('Haptic feedback', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should trigger selection haptic when header is pressed', () => {
      const { getByTestId } = renderWithTheme(
        <CollapsibleSection title="Test Title">
          <Text>Child content</Text>
        </CollapsibleSection>,
      );

      const header = getByTestId('collapsible-header');
      fireEvent.press(header);

      expect(hapticService.triggerSelectionHaptic).toHaveBeenCalled();
    });

    it('should trigger haptic on collapse', () => {
      const { getByTestId } = renderWithTheme(
        <CollapsibleSection title="Test Title">
          <Text>Child content</Text>
        </CollapsibleSection>,
      );

      const header = getByTestId('collapsible-header');

      // Expand
      fireEvent.press(header);
      jest.clearAllMocks();

      // Collapse
      fireEvent.press(header);

      expect(hapticService.triggerSelectionHaptic).toHaveBeenCalled();
    });
  });
});
