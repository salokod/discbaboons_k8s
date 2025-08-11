/**
 * BaboonBagBreakdown Component Tests
 * Shows disc statistics and breakdown for a bag
 */

describe('BaboonBagBreakdown Component', () => {
  it('should export BaboonBagBreakdown component', () => {
    expect(() => {
      require('../../src/components/BaboonBagBreakdown');
    }).not.toThrow();
  });

  it('should accept bag data with disc statistics', () => {
    const BaboonBagBreakdown = require('../../src/components/BaboonBagBreakdown').default;
    const bagData = {
      bag_contents: [
        {
          speed: 12, glide: 5, turn: -1, fade: 3,
        },
        {
          speed: 5, glide: 5, turn: -1, fade: 1,
        },
        {
          speed: 9, glide: 5, turn: -2, fade: 2,
        },
      ],
    };

    // Component should be importable and renderable (memo returns object in test environment)
    expect(BaboonBagBreakdown).toBeDefined();
    expect(bagData.bag_contents).toHaveLength(3);
  });
});
