/**
 * Hook to manage recent courses state
 * Loads courses on mount, provides refresh function
 */

import { useState, useEffect } from 'react';
import { getRecentCourses } from '../services/roundService';

export const useRecentCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const recentCourses = await getRecentCourses();
      setCourses(recentCourses);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  return {
    courses,
    loading,
    error,
    refresh: loadCourses,
  };
};
