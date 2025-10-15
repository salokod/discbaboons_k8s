/**
 * useRecentCourses Hook Tests
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useRecentCourses } from '../useRecentCourses';
import * as roundService from '../../services/roundService';

// Mock the roundService
jest.mock('../../services/roundService', () => ({
  getRecentCourses: jest.fn(),
}));

describe('useRecentCourses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    roundService.getRecentCourses.mockResolvedValue([]);

    const { result } = renderHook(() => useRecentCourses());

    expect(result.current.loading).toBe(true);
    expect(result.current.courses).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should load courses on mount', async () => {
    const mockCourses = [
      {
        id: 'course-1',
        name: 'Pier Park',
        location: 'Portland, OR',
        last_played_at: '2024-01-15T10:00:00Z',
      },
      {
        id: 'course-2',
        name: 'Blue Lake',
        location: 'Fairview, OR',
        last_played_at: '2024-01-14T10:00:00Z',
      },
    ];

    roundService.getRecentCourses.mockResolvedValue(mockCourses);

    const { result } = renderHook(() => useRecentCourses());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.courses).toEqual(mockCourses);
    expect(result.current.error).toBeNull();
    expect(roundService.getRecentCourses).toHaveBeenCalledTimes(1);
  });

  it('should set courses after successful load', async () => {
    const mockCourses = [
      {
        id: 'course-1',
        name: 'Pier Park',
        location: 'Portland, OR',
        last_played_at: '2024-01-15T10:00:00Z',
      },
    ];

    roundService.getRecentCourses.mockResolvedValue(mockCourses);

    const { result } = renderHook(() => useRecentCourses());

    await waitFor(() => {
      expect(result.current.courses).toEqual(mockCourses);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should set error on fetch failure', async () => {
    const errorMessage = 'Failed to fetch courses';
    roundService.getRecentCourses.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useRecentCourses());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.courses).toEqual([]);
  });

  it('should provide refresh function', async () => {
    const mockCourses = [
      {
        id: 'course-1',
        name: 'Pier Park',
        location: 'Portland, OR',
        last_played_at: '2024-01-15T10:00:00Z',
      },
    ];

    roundService.getRecentCourses.mockResolvedValue(mockCourses);

    const { result } = renderHook(() => useRecentCourses());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.refresh).toBe('function');
  });

  it('should clear error on refresh', async () => {
    // First call fails
    roundService.getRecentCourses.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useRecentCourses());

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });

    // Second call succeeds
    const mockCourses = [
      {
        id: 'course-1',
        name: 'Pier Park',
        location: 'Portland, OR',
        last_played_at: '2024-01-15T10:00:00Z',
      },
    ];
    roundService.getRecentCourses.mockResolvedValue(mockCourses);

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.courses).toEqual(mockCourses);
  });
});
