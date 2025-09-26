/**
 * ScreenWrapper Component
 * Provides consistent screen structure and safe area handling
 */

import PropTypes from 'prop-types';
import StatusBarSafeView from './StatusBarSafeView';

function ScreenWrapper({
  children, style, edges, testID, accessibilityLabel,
}) {
  return (
    <StatusBarSafeView
      style={style}
      edges={edges}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </StatusBarSafeView>
  );
}

ScreenWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  edges: PropTypes.arrayOf(PropTypes.string),
  testID: PropTypes.string,
  accessibilityLabel: PropTypes.string,
};

ScreenWrapper.defaultProps = {
  style: {},
  edges: ['top'],
  testID: undefined,
  accessibilityLabel: undefined,
};

export default ScreenWrapper;
