/**
 * Truncates coordinate values to 5 decimal places for consistency with Google Maps
 * 5 decimal places provides ~1 meter precision which is sufficient for disc golf courses
 */

const truncateCoordinate = (coordinate) => {
  if (coordinate === null || coordinate === undefined) {
    return coordinate;
  }

  const num = parseFloat(coordinate);
  if (Number.isNaN(num)) {
    return coordinate;
  }

  return Math.round(num * 100000) / 100000;
};

const truncateCoordinates = (latitude, longitude) => ({
  latitude: truncateCoordinate(latitude),
  longitude: truncateCoordinate(longitude),
});

/**
 * Processes a course object to ensure coordinates are properly truncated
 */
const processCourseCoordinates = (course) => {
  if (!course) return course;

  const processed = { ...course };

  if (processed.latitude !== null && processed.latitude !== undefined) {
    processed.latitude = truncateCoordinate(processed.latitude);
  }

  if (processed.longitude !== null && processed.longitude !== undefined) {
    processed.longitude = truncateCoordinate(processed.longitude);
  }

  return processed;
};

/**
 * Processes an array of course objects to ensure coordinates are properly truncated
 */
const processCoursesCoordinates = (courses) => {
  if (!Array.isArray(courses)) return courses;
  return courses.map(processCourseCoordinates);
};

export {
  truncateCoordinate, truncateCoordinates, processCourseCoordinates, processCoursesCoordinates,
};
