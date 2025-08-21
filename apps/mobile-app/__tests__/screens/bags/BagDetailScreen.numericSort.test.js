/**
 * BagDetailScreen Numeric Sorting Fix Tests
 * Tests for proper numeric sorting behavior
 */

describe('BagDetailScreen Numeric Sorting Fix', () => {
  // Test the sorting logic directly (isolated unit test)
  const mockBagContents = [
    {
      id: 'disc1',
      disc_master: { brand: 'TestBrand', model: 'TestDisc', speed: 10 },
    },
    {
      id: 'disc2',
      disc_master: { brand: 'TestBrand', model: 'TestDisc', speed: 2 },
    },
    {
      id: 'disc3',
      disc_master: { brand: 'TestBrand', model: 'TestDisc', speed: 1 },
    },
    {
      id: 'disc4',
      disc_master: { brand: 'TestBrand', model: 'TestDisc', speed: 11 },
    },
    {
      id: 'disc5',
      disc_master: { brand: 'TestBrand', model: 'TestDisc', speed: 3 },
    },
  ];

  // Helper function to test the current (broken) sorting logic
  const currentBrokenSort = (discs, field, direction = 'asc') => discs.slice().sort((a, b) => {
    let aVal = a[field] || a.disc_master?.[field] || '';
    let bVal = b[field] || b.disc_master?.[field] || '';

    // Handle numeric values (current broken logic)
    if (['speed', 'glide', 'turn', 'fade'].includes(field)) {
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
    }
    // Handle string values - THIS IS THE BUG: overwrites numeric values
    aVal = String(aVal).toLowerCase();
    bVal = String(bVal).toLowerCase();

    if (direction === 'asc') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  // Helper function to test the fixed sorting logic
  const fixedSort = (discs, field, direction = 'asc') => discs.slice().sort((a, b) => {
    let aVal = a[field] || a.disc_master?.[field] || '';
    let bVal = b[field] || b.disc_master?.[field] || '';

    // Handle numeric values vs string values separately
    if (['speed', 'glide', 'turn', 'fade'].includes(field)) {
      // Keep as numbers for numeric comparison
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;

      if (direction === 'asc') {
        return aVal - bVal;
      }
      return bVal - aVal;
    }
    // Handle string values
    aVal = String(aVal).toLowerCase();
    bVal = String(bVal).toLowerCase();

    if (direction === 'asc') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  it('should demonstrate the bug: current sorting treats numbers as strings', () => {
    // Current broken behavior - shows the bug
    const brokenResult = currentBrokenSort(mockBagContents, 'speed');
    const brokenSpeeds = brokenResult.map((disc) => disc.disc_master.speed);

    // This will be wrong: [1, 10, 11, 2, 3] (alphabetic string sorting)
    expect(brokenSpeeds).toEqual([1, 10, 11, 2, 3]);
  });

  it('should sort numeric speed values correctly with fixed logic (1,2,3,10,11)', () => {
    // Fixed behavior - proper numeric sorting
    const fixedResult = fixedSort(mockBagContents, 'speed');
    const fixedSpeeds = fixedResult.map((disc) => disc.disc_master.speed);

    // This should be correct: [1, 2, 3, 10, 11] (proper numeric sorting)
    expect(fixedSpeeds).toEqual([1, 2, 3, 10, 11]);
  });

  it('should sort negative turn values correctly with fixed logic', () => {
    const turnData = [
      { id: 'disc1', disc_master: { turn: 1 } },
      { id: 'disc2', disc_master: { turn: -3 } },
      { id: 'disc3', disc_master: { turn: -1 } },
      { id: 'disc4', disc_master: { turn: 0 } },
    ];

    const result = fixedSort(turnData, 'turn');
    const turns = result.map((disc) => disc.disc_master.turn);

    expect(turns).toEqual([-3, -1, 0, 1]);
  });

  it('should still sort string fields alphabetically (not numerically)', () => {
    const modelData = [
      { id: 'disc1', disc_master: { model: 'Model10' } },
      { id: 'disc2', disc_master: { model: 'Model2' } },
      { id: 'disc3', disc_master: { model: 'Model1' } },
    ];

    const result = fixedSort(modelData, 'model');
    const models = result.map((disc) => disc.disc_master.model);

    // String sorting should be alphabetic: Model1, Model10, Model2
    expect(models).toEqual(['Model1', 'Model10', 'Model2']);
  });

  it('should handle mixed numeric and null values gracefully', () => {
    const mixedData = [
      { id: 'disc1', disc_master: { speed: 10 } },
      { id: 'disc2', disc_master: { speed: null } },
      { id: 'disc3', disc_master: { speed: 5 } },
      { id: 'disc4', disc_master: { speed: '' } },
    ];

    const result = fixedSort(mixedData, 'speed');
    const speeds = result.map((disc) => disc.disc_master.speed);

    // null and '' should both become 0, so they come first, then 5, then 10
    expect(speeds).toEqual([null, '', 5, 10]);
  });
});
