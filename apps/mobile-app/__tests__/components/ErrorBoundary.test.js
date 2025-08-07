/**
 * ErrorBoundary Component Tests
 */

const ErrorBoundary = require('../../src/components/ErrorBoundary').default;

describe('ErrorBoundary component', () => {
  it('should export an ErrorBoundary component', () => {
    const ErrorBoundaryModule = require('../../src/components/ErrorBoundary');

    expect(ErrorBoundaryModule.default).toBeDefined();
    expect(typeof ErrorBoundaryModule.default).toBe('function');
  });

  it('should be a React class component with required methods', () => {
    expect(ErrorBoundary.prototype.componentDidCatch).toBeDefined();
    expect(ErrorBoundary.getDerivedStateFromError).toBeDefined();
    expect(typeof ErrorBoundary.getDerivedStateFromError).toBe('function');
  });

  it('should return error state when getDerivedStateFromError is called', () => {
    const error = new Error('Test error');
    const result = ErrorBoundary.getDerivedStateFromError(error);

    expect(result).toEqual({
      hasError: true,
      error,
    });
  });

  it('should have proper PropTypes defined', () => {
    // eslint-disable-next-line react/forbid-foreign-prop-types
    expect(ErrorBoundary.propTypes).toBeDefined();
    // eslint-disable-next-line react/forbid-foreign-prop-types
    expect(ErrorBoundary.propTypes.children).toBeDefined();
    // eslint-disable-next-line react/forbid-foreign-prop-types
    expect(ErrorBoundary.propTypes.fallback).toBeDefined();
  });

  it('should have proper defaultProps', () => {
    expect(ErrorBoundary.defaultProps).toBeDefined();
    expect(ErrorBoundary.defaultProps.fallback).toBe(null);
  });
});
