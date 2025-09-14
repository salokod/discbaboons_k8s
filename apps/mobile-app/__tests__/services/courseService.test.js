/**
 * CourseService Tests
 */

import { searchCourses, transformCourseData } from '../../src/services/courseService';
import { getTokens } from '../../src/services/tokenStorage';

// Mock the environment config
jest.mock('../../src/config/environment', () => ({
  API_BASE_URL: 'http://localhost:8080',
}));

// Mock tokenStorage service
jest.mock('../../src/services/tokenStorage', () => ({
  getTokens: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock timers globally
global.setTimeout = jest.fn(() => {
  const id = Math.random();
  return id;
});
global.clearTimeout = jest.fn();

describe('CourseService Functions', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    fetch.mockClear();
    global.setTimeout.mockClear();
    global.clearTimeout.mockClear();

    // Mock successful token retrieval
    getTokens.mockResolvedValue({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    });
  });

  describe('searchCourses', () => {
    it('should export a searchCourses function', () => {
      expect(searchCourses).toBeDefined();
      expect(typeof searchCourses).toBe('function');
    });

    it('should call correct API endpoint /api/courses (not /api/courses/search)', async () => {
      const mockResponse = {
        courses: [
          {
            id: 'course-123',
            name: 'Maple Hill Disc Golf Course',
            city: 'Leicester',
            state: 'MA',
            holes: 18,
            par: 63,
          },
        ],
        total: 1,
        limit: 20,
        offset: 0,
        hasMore: false,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await searchCourses();

      expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/courses', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-access-token',
        },
        signal: expect.any(AbortSignal),
      });
    });

    it('should successfully search courses with default parameters', async () => {
      const mockResponse = {
        courses: [
          {
            id: 'course-123',
            name: 'Maple Hill Disc Golf Course',
            city: 'Leicester',
            state_province: 'MA',
            hole_count: 18,
            par: 63,
          },
          {
            id: 'course-456',
            name: 'Sedgley Woods',
            city: 'Philadelphia',
            state_province: 'PA',
            hole_count: 27,
            par: 81,
          },
        ],
        total: 2,
        limit: 20,
        offset: 0,
        hasMore: false,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await searchCourses();

      expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/courses', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-access-token',
        },
        signal: expect.any(AbortSignal),
      });

      expect(result).toEqual({
        courses: [
          {
            id: 'course-123',
            name: 'Maple Hill Disc Golf Course',
            city: 'Leicester',
            state: 'MA',
            holes: 18,
            location: 'Leicester, MA',
            par: 63,
          },
          {
            id: 'course-456',
            name: 'Sedgley Woods',
            city: 'Philadelphia',
            state: 'PA',
            holes: 27,
            location: 'Philadelphia, PA',
            par: 81,
          },
        ],
        pagination: {
          total: mockResponse.total,
          limit: mockResponse.limit,
          offset: mockResponse.offset,
          hasMore: mockResponse.hasMore,
        },
      });
    });

    it('should use correct query parameter name "name" (not "q")', async () => {
      const mockResponse = {
        courses: [],
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const params = {
        q: 'Maple Hill',
        state: 'MA',
        limit: 10,
        offset: 0,
      };
      await searchCourses(params);

      expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/courses?name=Maple+Hill&state=MA&limit=10&offset=0', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-access-token',
        },
        signal: expect.any(AbortSignal),
      });
    });

    it('should successfully search courses with query parameters', async () => {
      const mockResponse = {
        courses: [],
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const params = {
        q: 'Maple Hill',
        state: 'MA',
        limit: 10,
        offset: 0,
      };
      await searchCourses(params);

      expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/courses?name=Maple+Hill&state=MA&limit=10&offset=0', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-access-token',
        },
        signal: expect.any(AbortSignal),
      });
    });

    it('should throw error when no auth token is available', async () => {
      getTokens.mockResolvedValue(null);

      await expect(searchCourses()).rejects.toThrow('Authentication required. Please log in again.');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should accept response format without success field', async () => {
      const validResponse = {
        courses: [
          {
            id: 'course-123',
            name: 'Test Course',
            city: 'Test City',
            state_province: 'TS',
            hole_count: 18,
            par: 54,
          },
        ],
        total: 1,
        limit: 20,
        offset: 0,
        hasMore: false,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => validResponse,
      });

      const result = await searchCourses();

      expect(result).toEqual({
        courses: [
          {
            id: 'course-123',
            name: 'Test Course',
            city: 'Test City',
            state: 'TS',
            holes: 18,
            location: 'Test City, TS',
            par: 54,
          },
        ],
        pagination: {
          total: validResponse.total,
          limit: validResponse.limit,
          offset: validResponse.offset,
          hasMore: validResponse.hasMore,
        },
      });
    });

    it('should handle invalid response format', async () => {
      const invalidResponse = {
        // Missing success field and courses field
        data: [],
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => invalidResponse,
      });

      await expect(searchCourses()).rejects.toThrow('Invalid response from server');
    });

    it('should handle 400 validation error', async () => {
      const errorResponse = {
        success: false,
        message: 'Invalid search parameters',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse,
      });

      await expect(searchCourses({ invalidParam: 'test' })).rejects.toThrow('Invalid search parameters');
    });

    it('should transform course data from API format to frontend format', async () => {
      const apiResponse = {
        courses: [
          {
            id: 'course-123',
            name: 'East Moline Disc Golf Course',
            city: 'East Moline',
            state_province: 'Illinois',
            hole_count: 9,
            is_user_submitted: false,
          },
          {
            id: 'course-456',
            name: 'Sedgley Woods',
            city: 'Philadelphia',
            state_province: 'Pennsylvania',
            hole_count: 27,
            par: 81,
            is_user_submitted: true,
          },
        ],
        total: 2,
        limit: 20,
        offset: 0,
        hasMore: false,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => apiResponse,
      });

      const result = await searchCourses();

      expect(result.courses).toEqual([
        {
          id: 'course-123',
          name: 'East Moline Disc Golf Course',
          city: 'East Moline',
          state: 'Illinois',
          holes: 9,
          location: 'East Moline, Illinois',
          is_user_submitted: false,
        },
        {
          id: 'course-456',
          name: 'Sedgley Woods',
          city: 'Philadelphia',
          state: 'Pennsylvania',
          holes: 27,
          par: 81,
          location: 'Philadelphia, Pennsylvania',
          is_user_submitted: true,
        },
      ]);

      expect(result.pagination).toEqual({
        total: 2,
        limit: 20,
        offset: 0,
        hasMore: false,
      });
    });
  });

  describe('transformCourseData', () => {
    it('should export a transformCourseData function', () => {
      expect(transformCourseData).toBeDefined();
      expect(typeof transformCourseData).toBe('function');
    });

    it('should transform API fields to frontend fields', () => {
      const apiCourse = {
        id: 'course-123',
        name: 'East Moline Disc Golf Course',
        city: 'East Moline',
        state_province: 'Illinois',
        hole_count: 9,
        is_user_submitted: false,
      };

      const result = transformCourseData(apiCourse);

      expect(result).toEqual({
        id: 'course-123',
        name: 'East Moline Disc Golf Course',
        city: 'East Moline',
        state: 'Illinois',
        holes: 9,
        location: 'East Moline, Illinois',
        is_user_submitted: false,
      });
    });

    it('should create location field from city and state', () => {
      const apiCourse = {
        id: 'course-456',
        name: 'Test Course',
        city: 'San Diego',
        state_province: 'CA',
        hole_count: 18,
      };

      const result = transformCourseData(apiCourse);

      expect(result.location).toBe('San Diego, CA');
    });

    it('should handle missing city gracefully', () => {
      const apiCourse = {
        id: 'course-789',
        name: 'Test Course',
        state_province: 'Illinois',
        hole_count: 12,
      };

      const result = transformCourseData(apiCourse);

      expect(result.state).toBe('Illinois');
      expect(result.location).toBe('Illinois');
    });

    it('should handle missing state_province gracefully', () => {
      const apiCourse = {
        id: 'course-101',
        name: 'Test Course',
        city: 'Chicago',
        hole_count: 15,
      };

      const result = transformCourseData(apiCourse);

      expect(result.state).toBeUndefined();
      expect(result.location).toBe('Chicago');
    });

    it('should preserve all other course properties', () => {
      const apiCourse = {
        id: 'course-202',
        name: 'Full Featured Course',
        city: 'Test City',
        state_province: 'Test State',
        hole_count: 21,
        par: 63,
        is_user_submitted: true,
        latitude: 41.5868,
        longitude: -91.1143,
      };

      const result = transformCourseData(apiCourse);

      expect(result.par).toBe(63);
      expect(result.is_user_submitted).toBe(true);
      expect(result.latitude).toBe(41.5868);
      expect(result.longitude).toBe(-91.1143);
    });
  });
});
