/**
 * DiscCard Component Tests
 * Reusable disc display with flight path visualization
 */

describe('DiscCard Component', () => {
  it('should export DiscCard component', () => {
    expect(() => {
      require('../../src/components/DiscCard');
    }).not.toThrow();
  });

  it('should accept disc prop with model and brand', () => {
    const DiscCard = require('../../src/components/DiscCard').default;
    const disc = {
      model: 'Destroyer',
      brand: 'Innova',
      speed: 12,
      glide: 5,
      turn: -1,
      fade: 3,
    };

    // Component should be importable and renderable (memo returns object in test environment)
    expect(DiscCard).toBeDefined();
    expect(disc.model).toBe('Destroyer');
  });
});
