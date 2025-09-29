import { render } from '@testing-library/react-native';
import PaginationControls from '../PaginationControls';

// Mock dependencies
jest.mock('../../context/ThemeContext', () => ({
  useThemeColors: () => ({
    background: '#FFFFFF',
    surface: '#FFFFFF',
    text: '#000000',
    textLight: '#666666',
    primary: '#007AFF',
    border: '#E1E1E1',
  }),
}));

describe('PaginationControls', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 3,
    onPageChange: jest.fn(),
    isLoading: false,
    testID: 'pagination-controls',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export a function component', () => {
    expect(typeof PaginationControls).toBe('function');
  });

  it('should render with required props', () => {
    const { getByTestId } = render(
      <PaginationControls
        currentPage={defaultProps.currentPage}
        totalPages={defaultProps.totalPages}
        onPageChange={defaultProps.onPageChange}
        isLoading={defaultProps.isLoading}
        testID={defaultProps.testID}
      />,
    );

    expect(getByTestId('pagination-controls')).toBeTruthy();
  });

  it('should render left arrow button', () => {
    const { getByTestId } = render(
      <PaginationControls
        currentPage={defaultProps.currentPage}
        totalPages={defaultProps.totalPages}
        onPageChange={defaultProps.onPageChange}
        isLoading={defaultProps.isLoading}
        testID={defaultProps.testID}
      />,
    );

    expect(getByTestId('pagination-left-arrow')).toBeTruthy();
  });

  it('should render right arrow button', () => {
    const { getByTestId } = render(
      <PaginationControls
        currentPage={defaultProps.currentPage}
        totalPages={defaultProps.totalPages}
        onPageChange={defaultProps.onPageChange}
        isLoading={defaultProps.isLoading}
        testID={defaultProps.testID}
      />,
    );

    expect(getByTestId('pagination-right-arrow')).toBeTruthy();
  });

  it('should render page indicator text', () => {
    const { getByTestId } = render(
      <PaginationControls
        currentPage={1}
        totalPages={3}
        onPageChange={defaultProps.onPageChange}
        isLoading={defaultProps.isLoading}
        testID={defaultProps.testID}
      />,
    );

    const pageIndicator = getByTestId('pagination-page-indicator');
    expect(pageIndicator).toBeTruthy();
    expect(pageIndicator).toHaveTextContent('Page 1 of 3');
  });

  it('should call onPageChange with previous page when left arrow is pressed', () => {
    const mockOnPageChange = jest.fn();
    const { getByTestId } = render(
      <PaginationControls
        currentPage={2}
        totalPages={3}
        onPageChange={mockOnPageChange}
        isLoading={false}
        testID={defaultProps.testID}
      />,
    );

    const { fireEvent } = require('@testing-library/react-native');
    const leftArrow = getByTestId('pagination-left-arrow');
    fireEvent.press(leftArrow);

    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });

  it('should call onPageChange with next page when right arrow is pressed', () => {
    const mockOnPageChange = jest.fn();
    const { getByTestId } = render(
      <PaginationControls
        currentPage={2}
        totalPages={3}
        onPageChange={mockOnPageChange}
        isLoading={false}
        testID={defaultProps.testID}
      />,
    );

    const { fireEvent } = require('@testing-library/react-native');
    const rightArrow = getByTestId('pagination-right-arrow');
    fireEvent.press(rightArrow);

    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  it('should disable left arrow when on first page', () => {
    const { getByTestId } = render(
      <PaginationControls
        currentPage={1}
        totalPages={3}
        onPageChange={defaultProps.onPageChange}
        isLoading={false}
        testID={defaultProps.testID}
      />,
    );

    const leftArrow = getByTestId('pagination-left-arrow');
    expect(leftArrow.props.accessibilityState?.disabled).toBe(true);
  });

  it('should disable right arrow when on last page', () => {
    const { getByTestId } = render(
      <PaginationControls
        currentPage={3}
        totalPages={3}
        onPageChange={defaultProps.onPageChange}
        isLoading={false}
        testID={defaultProps.testID}
      />,
    );

    const rightArrow = getByTestId('pagination-right-arrow');
    expect(rightArrow.props.accessibilityState?.disabled).toBe(true);
  });

  it('should not call onPageChange when left arrow is pressed on first page', () => {
    const mockOnPageChange = jest.fn();
    const { getByTestId } = render(
      <PaginationControls
        currentPage={1}
        totalPages={3}
        onPageChange={mockOnPageChange}
        isLoading={false}
        testID={defaultProps.testID}
      />,
    );

    const { fireEvent } = require('@testing-library/react-native');
    const leftArrow = getByTestId('pagination-left-arrow');
    fireEvent.press(leftArrow);

    expect(mockOnPageChange).not.toHaveBeenCalled();
  });

  it('should not call onPageChange when right arrow is pressed on last page', () => {
    const mockOnPageChange = jest.fn();
    const { getByTestId } = render(
      <PaginationControls
        currentPage={3}
        totalPages={3}
        onPageChange={mockOnPageChange}
        isLoading={false}
        testID={defaultProps.testID}
      />,
    );

    const { fireEvent } = require('@testing-library/react-native');
    const rightArrow = getByTestId('pagination-right-arrow');
    fireEvent.press(rightArrow);

    expect(mockOnPageChange).not.toHaveBeenCalled();
  });

  it('should disable both arrows when loading', () => {
    const { getByTestId } = render(
      <PaginationControls
        currentPage={2}
        totalPages={3}
        onPageChange={defaultProps.onPageChange}
        isLoading
        testID={defaultProps.testID}
      />,
    );

    const leftArrow = getByTestId('pagination-left-arrow');
    const rightArrow = getByTestId('pagination-right-arrow');

    expect(leftArrow.props.accessibilityState?.disabled).toBe(true);
    expect(rightArrow.props.accessibilityState?.disabled).toBe(true);
  });

  it('should show loading text when isLoading is true', () => {
    const { getByTestId } = render(
      <PaginationControls
        currentPage={2}
        totalPages={3}
        onPageChange={defaultProps.onPageChange}
        isLoading
        testID={defaultProps.testID}
      />,
    );

    const pageIndicator = getByTestId('pagination-page-indicator');
    expect(pageIndicator).toHaveTextContent('Loading...');
  });

  it('should not call onPageChange when loading and buttons are pressed', () => {
    const mockOnPageChange = jest.fn();
    const { getByTestId } = render(
      <PaginationControls
        currentPage={2}
        totalPages={3}
        onPageChange={mockOnPageChange}
        isLoading
        testID={defaultProps.testID}
      />,
    );

    const { fireEvent } = require('@testing-library/react-native');
    const leftArrow = getByTestId('pagination-left-arrow');
    const rightArrow = getByTestId('pagination-right-arrow');

    fireEvent.press(leftArrow);
    fireEvent.press(rightArrow);

    expect(mockOnPageChange).not.toHaveBeenCalled();
  });

  it('should apply proper styling to container', () => {
    const { getByTestId } = render(
      <PaginationControls
        currentPage={2}
        totalPages={3}
        onPageChange={defaultProps.onPageChange}
        isLoading={false}
        testID={defaultProps.testID}
      />,
    );

    const container = getByTestId('pagination-controls');
    expect(container.props.style).toBeDefined();
  });

  it('should apply proper styling to arrow buttons', () => {
    const { getByTestId } = render(
      <PaginationControls
        currentPage={2}
        totalPages={3}
        onPageChange={defaultProps.onPageChange}
        isLoading={false}
        testID={defaultProps.testID}
      />,
    );

    const leftArrow = getByTestId('pagination-left-arrow');
    const rightArrow = getByTestId('pagination-right-arrow');

    expect(leftArrow.props.style).toBeDefined();
    expect(rightArrow.props.style).toBeDefined();
  });

  it('should apply proper styling to page indicator text', () => {
    const { getByTestId } = render(
      <PaginationControls
        currentPage={2}
        totalPages={3}
        onPageChange={defaultProps.onPageChange}
        isLoading={false}
        testID={defaultProps.testID}
      />,
    );

    const pageIndicator = getByTestId('pagination-page-indicator');
    expect(pageIndicator.props.style).toBeDefined();
  });

  it('should have proper accessibility labels for arrow buttons', () => {
    const { getByTestId } = render(
      <PaginationControls
        currentPage={2}
        totalPages={3}
        onPageChange={defaultProps.onPageChange}
        isLoading={false}
        testID={defaultProps.testID}
      />,
    );

    const leftArrow = getByTestId('pagination-left-arrow');
    const rightArrow = getByTestId('pagination-right-arrow');

    expect(leftArrow.props.accessibilityLabel).toBe('Go to previous page');
    expect(rightArrow.props.accessibilityLabel).toBe('Go to next page');
  });

  it('should have proper accessibility hints for arrow buttons', () => {
    const { getByTestId } = render(
      <PaginationControls
        currentPage={2}
        totalPages={3}
        onPageChange={defaultProps.onPageChange}
        isLoading={false}
        testID={defaultProps.testID}
      />,
    );

    const leftArrow = getByTestId('pagination-left-arrow');
    const rightArrow = getByTestId('pagination-right-arrow');

    expect(leftArrow.props.accessibilityHint).toBe('Navigate to page 1');
    expect(rightArrow.props.accessibilityHint).toBe('Navigate to page 3');
  });

  it('should have button accessibility role for arrow buttons', () => {
    const { getByTestId } = render(
      <PaginationControls
        currentPage={2}
        totalPages={3}
        onPageChange={defaultProps.onPageChange}
        isLoading={false}
        testID={defaultProps.testID}
      />,
    );

    const leftArrow = getByTestId('pagination-left-arrow');
    const rightArrow = getByTestId('pagination-right-arrow');

    expect(leftArrow.props.accessibilityRole).toBe('button');
    expect(rightArrow.props.accessibilityRole).toBe('button');
  });

  it('should update accessibility hints based on disabled state', () => {
    const { getByTestId } = render(
      <PaginationControls
        currentPage={1}
        totalPages={3}
        onPageChange={defaultProps.onPageChange}
        isLoading={false}
        testID={defaultProps.testID}
      />,
    );

    const leftArrow = getByTestId('pagination-left-arrow');
    expect(leftArrow.props.accessibilityHint).toBe('Already on first page');
  });

  it('should have accessibility label for page indicator', () => {
    const { getByTestId } = render(
      <PaginationControls
        currentPage={2}
        totalPages={3}
        onPageChange={defaultProps.onPageChange}
        isLoading={false}
        testID={defaultProps.testID}
      />,
    );

    const pageIndicator = getByTestId('pagination-page-indicator');
    expect(pageIndicator.props.accessibilityLabel).toBe('Currently on page 2 of 3');
  });

  it('should announce page changes with live region', () => {
    const { getByTestId } = render(
      <PaginationControls
        currentPage={2}
        totalPages={3}
        onPageChange={defaultProps.onPageChange}
        isLoading={false}
        testID={defaultProps.testID}
      />,
    );

    const liveRegion = getByTestId('pagination-live-region');
    expect(liveRegion.props.accessibilityLiveRegion).toBe('polite');
  });
});
