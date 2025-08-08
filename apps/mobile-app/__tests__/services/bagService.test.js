/**
 * BagService Tests
 */

import {
  getBags, createBag, updateBag, deleteBag,
} from '../../src/services/bagService';

describe('bagService', () => {
  it('should export a getBags function', () => {
    expect(getBags).toBeTruthy();
  });

  it('should export a createBag function', () => {
    expect(createBag).toBeTruthy();
  });

  it('should export a updateBag function', () => {
    expect(updateBag).toBeTruthy();
  });

  it('should export a deleteBag function', () => {
    expect(deleteBag).toBeTruthy();
  });
});
