import { formatRoundStartTime } from '../dateFormatter';

describe('dateFormatter', () => {
  it('should export a function', () => {
    expect(typeof formatRoundStartTime).toBe('function');
  });

  it('should format date from today with relative time', () => {
    // Test with a time from today
    const today = new Date();
    const todayAt2PM = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 29, 0);
    const result = formatRoundStartTime(todayAt2PM.toISOString());

    expect(result).toBe('Started 2:29 PM today');
  });

  it('should format date from yesterday', () => {
    // Test with yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayAt3PM = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 15, 30, 0);
    const result = formatRoundStartTime(yesterdayAt3PM.toISOString());

    expect(result).toBe('Started 3:30 PM yesterday');
  });

  it('should format date from this week with day name', () => {
    // Test with a date from this week (3 days ago)
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 3);
    const weekdayAt11AM = new Date(thisWeek.getFullYear(), thisWeek.getMonth(), thisWeek.getDate(), 11, 0, 0);
    const result = formatRoundStartTime(weekdayAt11AM.toISOString());

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const expectedDay = dayNames[thisWeek.getDay()];
    expect(result).toBe(`Started 11:00 AM ${expectedDay}`);
  });
});