// Network service wrapper for @react-native-community/netinfo

// Mock NetInfo for testing until package is installed
let NetInfo;
try {
  NetInfo = require('@react-native-community/netinfo');
} catch (error) {
  // Provide a mock for tests before package is installed
  NetInfo = {
    fetch: async () => ({ isConnected: true }),
    addEventListener: () => () => {},
  };
}

async function isConnected() {
  const state = await NetInfo.fetch();
  return state.isConnected;
}

function addEventListener(callback) {
  const unsubscribe = NetInfo.addEventListener((state) => {
    callback(state.isConnected);
  });
  return unsubscribe;
}

function removeEventListener(unsubscribe) {
  if (unsubscribe) {
    unsubscribe();
  }
}

module.exports = {
  isConnected,
  addEventListener,
  removeEventListener,
};
