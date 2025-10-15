/**
 * courseHelpers Tests
 */

import { formatLastPlayed, getCourseInitial } from '../courseHelpers';

describe('courseHelpers', () => {
  describe('formatLastPlayed', () => {
    it('should return "today" for current date', () => {
      const now = new Date();
      const result = formatLastPlayed(now.toISOString());
      expect(result).toBe('today');
    });

    it('should return "1d" for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const result = formatLastPlayed(yesterday.toISOString());
      expect(result).toBe('1d');
    });

    it('should return "Xd" for 2-6 days ago', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const result = formatLastPlayed(threeDaysAgo.toISOString());
      expect(result).toBe('3d');

      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      const result2 = formatLastPlayed(fiveDaysAgo.toISOString());
      expect(result2).toBe('5d');
    });

    it('should return "1w" for 7 days ago', () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const result = formatLastPlayed(sevenDaysAgo.toISOString());
      expect(result).toBe('1w');
    });

    it('should return "Xw" for 2-4 weeks', () => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const result = formatLastPlayed(twoWeeksAgo.toISOString());
      expect(result).toBe('2w');

      const threeWeeksAgo = new Date();
      threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);
      const result2 = formatLastPlayed(threeWeeksAgo.toISOString());
      expect(result2).toBe('3w');
    });

    it('should return "1mo" for ~30 days ago', () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const result = formatLastPlayed(thirtyDaysAgo.toISOString());
      expect(result).toBe('1mo');
    });

    it('should return "Xmo" for 2-11 months', () => {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const result = formatLastPlayed(sixtyDaysAgo.toISOString());
      expect(result).toBe('2mo');

      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const result2 = formatLastPlayed(ninetyDaysAgo.toISOString());
      expect(result2).toBe('3mo');
    });

    it('should return "1y" for ~365 days ago', () => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const result = formatLastPlayed(oneYearAgo.toISOString());
      expect(result).toBe('1y');
    });

    it('should return "Xy" for multiple years', () => {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      const result = formatLastPlayed(twoYearsAgo.toISOString());
      expect(result).toBe('2y');

      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      const result2 = formatLastPlayed(threeYearsAgo.toISOString());
      expect(result2).toBe('3y');
    });

    it('should handle invalid timestamps gracefully', () => {
      const result = formatLastPlayed('invalid-date');
      // NaN - NaN results in NaN, Math.floor(NaN) results in NaN
      // diffDays === 0 would be false, diffDays === 1 would be false
      // diffDays < 7 would be false, diffDays < 30 would be false
      // diffDays < 365 would be false, so it returns NaNy
      expect(result).toBe('NaNy');
    });
  });

  describe('getCourseInitial', () => {
    it('should return first letter uppercase', () => {
      const result = getCourseInitial('Maple Hill');
      expect(result).toBe('M');
    });

    it('should return first letter for lowercase input', () => {
      const result = getCourseInitial('blue lake');
      expect(result).toBe('B');
    });

    it('should handle empty string', () => {
      const result = getCourseInitial('');
      expect(result).toBe('?');
    });

    it('should handle null', () => {
      const result = getCourseInitial(null);
      expect(result).toBe('?');
    });

    it('should handle undefined', () => {
      const result = getCourseInitial(undefined);
      expect(result).toBe('?');
    });

    it('should handle numbers', () => {
      const result = getCourseInitial(123);
      expect(result).toBe('?');
    });
  });
});
