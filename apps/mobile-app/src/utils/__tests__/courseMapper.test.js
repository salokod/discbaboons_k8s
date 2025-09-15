import { getCourseDisplayName } from '../courseMapper';

describe('courseMapper', () => {
  it('should export a function', () => {
    expect(typeof getCourseDisplayName).toBe('function');
  });

  it('should return formatted course name for known course IDs', () => {
    expect(getCourseDisplayName('prospect-park')).toBe('Prospect Park');
    expect(getCourseDisplayName('central-park')).toBe('Central Park');
    expect(getCourseDisplayName('golden-gate-park')).toBe('Golden Gate Park');
  });

  it('should handle course IDs with hyphens and underscores', () => {
    expect(getCourseDisplayName('bethpage-black')).toBe('Bethpage Black');
    expect(getCourseDisplayName('pebble_beach')).toBe('Pebble Beach');
  });

  it('should return original course ID when no mapping exists', () => {
    expect(getCourseDisplayName('unknown-course')).toBe('unknown-course');
    expect(getCourseDisplayName('random_id')).toBe('random_id');
  });

  it('should handle empty or null course IDs gracefully', () => {
    expect(getCourseDisplayName('')).toBe('');
    expect(getCourseDisplayName(null)).toBe('');
    expect(getCourseDisplayName(undefined)).toBe('');
  });
});
