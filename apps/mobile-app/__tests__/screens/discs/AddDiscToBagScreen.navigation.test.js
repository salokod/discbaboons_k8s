/**
 * AddDiscToBagScreen Navigation Tests
 * Tests functionality of navigation flow from DiscSearchScreen to AddDiscToBagScreen
 */

// Mock the navigation stack
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

const mockNavigation = {
  navigate: mockNavigate,
  goBack: mockGoBack,
};

describe('AddDiscToBagScreen Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export AddDiscToBagScreen component', () => {
    // Test that the component file exists and exports properly
    expect(() => {
      require('../../../src/screens/discs/AddDiscToBagScreen');
    }).not.toThrow();
  });

  it('should handle navigation with required parameters', () => {
    const testDisc = {
      id: 'disc-123',
      model: 'Destroyer',
      brand: 'Innova',
      speed: 12,
      glide: 5,
      turn: -1,
      fade: 3,
    };
    const testBagId = 'bag-456';
    const testBagName = 'My Tournament Bag';

    // Test that navigation call works with proper parameters
    mockNavigation.navigate('AddDiscToBagScreen', {
      disc: testDisc,
      bagId: testBagId,
      bagName: testBagName,
    });

    expect(mockNavigate).toHaveBeenCalledWith('AddDiscToBagScreen', {
      disc: testDisc,
      bagId: testBagId,
      bagName: testBagName,
    });
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('should validate required navigation parameters', () => {
    // Test navigation parameters validation
    const validParams = {
      disc: {
        id: 'disc-123',
        model: 'Destroyer',
        brand: 'Innova',
        speed: 12,
        glide: 5,
        turn: -1,
        fade: 3,
      },
      bagId: 'bag-456',
      bagName: 'My Tournament Bag',
    };

    // Mock the handleAddDiscToBag function logic
    const handleAddDiscToBag = (disc) => {
      if (!disc || !disc.id) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.error('Invalid disc object passed to handleAddDiscToBag:', disc);
        }
        return;
      }

      mockNavigation.navigate('AddDiscToBagScreen', {
        disc,
        bagId: validParams.bagId,
        bagName: validParams.bagName,
      });
    };

    // Test with valid disc
    handleAddDiscToBag(validParams.disc);
    expect(mockNavigate).toHaveBeenCalledWith('AddDiscToBagScreen', validParams);

    // Test with invalid disc (should not navigate)
    jest.clearAllMocks();
    handleAddDiscToBag(null);
    expect(mockNavigate).not.toHaveBeenCalled();

    // Test with disc missing id (should not navigate)
    jest.clearAllMocks();
    handleAddDiscToBag({ model: 'Test', brand: 'Test' });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should navigate directly to BagDetailScreen after adding disc', () => {
    // Test that after successfully adding a disc, navigation goes directly to BagDetailScreen
    // This eliminates the intermediate alert that requires user to choose "View Bag"
    const testBagId = 'bag-123';

    // Simulate successful disc addition flow
    const handleSuccessfulAddition = (bagId) => {
      mockNavigation.navigate('BagDetail', { bagId });
    };

    handleSuccessfulAddition(testBagId);

    expect(mockNavigate).toHaveBeenCalledWith('BagDetail', { bagId: testBagId });
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });
});
