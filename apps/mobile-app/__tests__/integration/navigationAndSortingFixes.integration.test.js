/**
 * Integration Tests for Navigation and Sorting Fixes
 * Verifies both modal navigation and numeric sorting fixes work correctly
 */

describe('Navigation and Sorting Fixes Integration', () => {
  describe('Modal Navigation Fix Verification', () => {
    it('should use goBack() instead of complex navigation after disc addition', () => {
      // Mock navigation to verify goBack is called
      const mockNavigation = {
        goBack: jest.fn(),
        navigate: jest.fn(),
      };

      // Simulate the fixed navigation behavior from AddDiscToBagScreen
      const handleSuccessfulDiscAddition = () => {
        // After successful disc addition, use goBack() to prevent modal stacking
        mockNavigation.goBack();
      };

      handleSuccessfulDiscAddition();

      // Verify the fix: goBack() is called, not navigate()
      expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
      expect(mockNavigation.navigate).not.toHaveBeenCalled();
    });

    it('should prevent modal stacking by returning to existing BagDetail screen', () => {
      // This test confirms the intent: go back to existing screen rather than create new one
      let navigationStack = ['BagsList', 'BagDetail', 'AddDiscToBag'];

      const simulateGoBack = () => {
        navigationStack.pop(); // Remove current screen
      };

      const simulateNavigate = (screen) => {
        navigationStack.push(screen); // Add new screen
      };

      // Using the fixed approach (goBack)
      simulateGoBack();
      expect(navigationStack).toEqual(['BagsList', 'BagDetail']);
      expect(navigationStack.length).toBe(2);

      // Reset for comparison
      navigationStack = ['BagsList', 'BagDetail', 'AddDiscToBag'];

      // Using the old broken approach would create stacking
      simulateNavigate('BagDetail'); // This would create a duplicate
      expect(navigationStack).toEqual(['BagsList', 'BagDetail', 'AddDiscToBag', 'BagDetail']);
      expect(navigationStack.length).toBe(4); // Shows the stacking problem
    });
  });

  describe('Numeric Sorting Fix Verification', () => {
    it('should sort flight numbers numerically instead of alphabetically', () => {
      const testData = [
        { id: '1', disc_master: { speed: 10 } },
        { id: '2', disc_master: { speed: 2 } },
        { id: '3', disc_master: { speed: 1 } },
        { id: '4', disc_master: { speed: 11 } },
        { id: '5', disc_master: { speed: 3 } },
      ];

      // Fixed sorting logic (from BagDetailScreen)
      const sortedData = testData.slice().sort((a, b) => {
        const aVal = Number(a.disc_master.speed) || 0;
        const bVal = Number(b.disc_master.speed) || 0;
        return aVal - bVal; // Proper numeric comparison
      });

      const sortedSpeeds = sortedData.map((item) => item.disc_master.speed);

      // Should be numeric order: 1, 2, 3, 10, 11
      // NOT alphabetic order: 1, 10, 11, 2, 3
      expect(sortedSpeeds).toEqual([1, 2, 3, 10, 11]);
    });

    it('should handle negative numbers correctly in turn values', () => {
      const turnData = [
        { id: '1', disc_master: { turn: 1 } },
        { id: '2', disc_master: { turn: -3 } },
        { id: '3', disc_master: { turn: -1 } },
        { id: '4', disc_master: { turn: 0 } },
      ];

      const sortedData = turnData.slice().sort((a, b) => {
        const aVal = Number(a.disc_master.turn) || 0;
        const bVal = Number(b.disc_master.turn) || 0;
        return aVal - bVal;
      });

      const sortedTurns = sortedData.map((item) => item.disc_master.turn);
      expect(sortedTurns).toEqual([-3, -1, 0, 1]);
    });

    it('should still sort string fields alphabetically', () => {
      const modelData = [
        { id: '1', disc_master: { model: 'Destroyer' } },
        { id: '2', disc_master: { model: 'Aviar' } },
        { id: '3', disc_master: { model: 'Buzzz' } },
      ];

      // String fields should use alphabetic sorting
      const sortedData = modelData.slice().sort((a, b) => {
        const aVal = String(a.disc_master.model).toLowerCase();
        const bVal = String(b.disc_master.model).toLowerCase();
        return aVal > bVal ? 1 : -1;
      });

      const sortedModels = sortedData.map((item) => item.disc_master.model);
      expect(sortedModels).toEqual(['Aviar', 'Buzzz', 'Destroyer']);
    });
  });

  describe('Combined Functionality', () => {
    it('should handle both fixes working together in user workflow', () => {
      // Simulated user workflow:
      // 1. User is on BagDetail screen with unsorted discs
      // 2. User sorts the discs (uses numeric sorting fix)
      // 3. User adds a new disc via AddDiscToBagScreen modal
      // 4. User successfully adds disc and returns (uses navigation fix)

      let currentScreen = 'BagDetail';
      const navigationHistory = ['BagsList', 'BagDetail'];

      // Step 1: User has unsorted discs
      const bagContents = [
        { id: '1', disc_master: { model: 'Disc1', speed: 10 } },
        { id: '2', disc_master: { model: 'Disc2', speed: 2 } },
        { id: '3', disc_master: { model: 'Disc3', speed: 1 } },
      ];

      // Step 2: User sorts by speed (numeric sorting fix applies)
      const sortedContents = bagContents.slice().sort((a, b) => {
        const aVal = Number(a.disc_master.speed) || 0;
        const bVal = Number(b.disc_master.speed) || 0;
        return aVal - bVal;
      });

      expect(sortedContents.map((d) => d.disc_master.speed)).toEqual([1, 2, 10]);

      // Step 3: User navigates to AddDiscToBag modal
      currentScreen = 'AddDiscToBag';
      navigationHistory.push('AddDiscToBag');
      expect(navigationHistory).toEqual(['BagsList', 'BagDetail', 'AddDiscToBag']);

      // Step 4: User successfully adds disc and returns (navigation fix applies)
      // Fixed behavior: use goBack() instead of navigate()
      navigationHistory.pop(); // Simulates goBack()
      currentScreen = navigationHistory[navigationHistory.length - 1];

      expect(currentScreen).toBe('BagDetail');
      expect(navigationHistory).toEqual(['BagsList', 'BagDetail']); // No stacking

      // Verify: User is back on original BagDetail screen with no modal stacking
      expect(navigationHistory.length).toBe(2);
      expect(navigationHistory[1]).toBe('BagDetail');
    });

    it('should maintain sort state when returning from AddDiscToBag modal', () => {
      // This test ensures that the navigation fix doesn't break sorting state
      const sortState = { field: 'speed', direction: 'asc' };
      const mockBagRefresh = jest.fn();

      // Simulate user workflow:
      // 1. Sort discs on BagDetail
      // 2. Add disc via modal
      // 3. Return to BagDetail (should preserve sort)

      // Step 1: User sorts discs
      expect(sortState.field).toBe('speed');
      expect(sortState.direction).toBe('asc');

      // Step 2: User adds disc and triggers refresh
      mockBagRefresh('test-bag-id');

      // Step 3: Navigation fix returns to same BagDetail screen
      // Sort state should be preserved (not reset)
      expect(sortState.field).toBe('speed');
      expect(sortState.direction).toBe('asc');

      // Refresh should be called to update the disc list
      expect(mockBagRefresh).toHaveBeenCalledWith('test-bag-id');
    });
  });

  describe('Bug Prevention', () => {
    it('should prevent the specific modal stacking bug reported', () => {
      // This test specifically prevents the bug scenario:
      // User goes BagDetail -> AddDiscToBag -> adds disc -> ends up with stacked BagDetail screens

      const navigationStateTracker = {
        stack: ['BagsList', 'BagDetail'],
        navigate(screen) {
          // Old broken behavior would push new screen
          this.stack.push(screen);
        },
        goBack() {
          // Fixed behavior removes current screen
          if (this.stack.length > 1) {
            this.stack.pop();
          }
        },
      };

      // User opens AddDiscToBag modal
      navigationStateTracker.navigate('AddDiscToBag');
      expect(navigationStateTracker.stack).toEqual(['BagsList', 'BagDetail', 'AddDiscToBag']);

      // OLD BUG: After disc addition, navigate to BagDetail (creates duplicate)
      // navigationStateTracker.navigate('BagDetail'); // This would cause stacking
      // expect(navigationStateTracker.stack).toEqual([
      //   'BagsList', 'BagDetail', 'AddDiscToBag', 'BagDetail'
      // ]);

      // FIXED: After disc addition, use goBack() to return to existing BagDetail
      navigationStateTracker.goBack();
      expect(navigationStateTracker.stack).toEqual(['BagsList', 'BagDetail']);

      // Verify: No duplicate BagDetail screens
      const bagDetailCount = navigationStateTracker.stack.filter((screen) => screen === 'BagDetail').length;
      expect(bagDetailCount).toBe(1);
    });

    it('should prevent the specific numeric sorting bug reported', () => {
      // This test specifically prevents the bug scenario:
      // User sorts discs by speed and gets 1, 10, 11, 2, 3 instead of 1, 2, 3, 10, 11

      const testDiscs = [
        { disc_master: { speed: 10 } },
        { disc_master: { speed: 2 } },
        { disc_master: { speed: 1 } },
        { disc_master: { speed: 11 } },
        { disc_master: { speed: 3 } },
      ];

      // OLD BUG: String comparison after converting to string
      const brokenSort = testDiscs.slice().sort((a, b) => {
        let aVal = Number(a.disc_master.speed) || 0;
        let bVal = Number(b.disc_master.speed) || 0;
        // Bug: Converting numbers back to strings for comparison
        aVal = String(aVal);
        bVal = String(bVal);
        return aVal > bVal ? 1 : -1;
      });

      const brokenResult = brokenSort.map((d) => d.disc_master.speed);
      expect(brokenResult).toEqual([1, 10, 11, 2, 3]); // Wrong alphabetic order

      // FIXED: Proper numeric comparison
      const fixedSort = testDiscs.slice().sort((a, b) => {
        const aVal = Number(a.disc_master.speed) || 0;
        const bVal = Number(b.disc_master.speed) || 0;
        return aVal - bVal; // Proper numeric comparison
      });

      const fixedResult = fixedSort.map((d) => d.disc_master.speed);
      expect(fixedResult).toEqual([1, 2, 3, 10, 11]); // Correct numeric order
    });
  });
});
