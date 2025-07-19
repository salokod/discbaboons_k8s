import { queryOne } from '../lib/database.js';

const coursesSubmitService = async (userId, courseData = {}) => {
  if (!userId) {
    const error = new Error('userId is required');
    error.name = 'ValidationError';
    throw error;
  }

  const {
    name, city, stateProvince, country = 'US', holeCount, postalCode, latitude, longitude,
  } = courseData;

  if (!name) {
    const error = new Error('Course name is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!city) {
    const error = new Error('City is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!stateProvince) {
    const error = new Error('State/Province is required');
    error.name = 'ValidationError';
    throw error;
  }

  if (!holeCount || !Number.isInteger(holeCount) || holeCount < 1) {
    const error = new Error('Hole count is required and must be a positive integer');
    error.name = 'ValidationError';
    throw error;
  }

  if (!country) {
    const error = new Error('Country is required');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate country-specific state/province codes
  const validateStateProvince = (countryCode, stateProvinceCode) => {
    const validationRules = {
      US: {
        values: [
          'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
          'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
          'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
          'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
          'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
        ],
        error: 'State must be a valid 2-character US state abbreviation (e.g., CA, TX, NY)',
      },
      CA: {
        values: ['AB', 'BC', 'MB', 'NB', 'NL', 'NT', 'NS', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'],
        error: 'Province must be a valid 2-character Canadian province code (e.g., ON, BC, QC)',
      },
      // For other countries, we'll be more lenient for now
    };

    const rules = validationRules[countryCode.toUpperCase()];
    if (rules && !rules.values.includes(stateProvinceCode.toUpperCase())) {
      const error = new Error(rules.error);
      error.name = 'ValidationError';
      throw error;
    }
  };

  // Validate country code (inclusive approach - accept any valid ISO format)
  const isValidCountryCode = (code) => /^[A-Z]{2}$/.test(code.toUpperCase());

  if (!isValidCountryCode(country)) {
    const error = new Error('Country must be a valid 2-character ISO code (e.g., US, CA, AU, GB, JP, BR, MX)');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate state/province for the given country
  validateStateProvince(country, stateProvince);

  // Validate optional latitude
  if (latitude !== undefined && latitude !== null) {
    if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
      const error = new Error('Latitude must be between -90 and 90');
      error.name = 'ValidationError';
      throw error;
    }
  }

  // Validate optional longitude
  if (longitude !== undefined && longitude !== null) {
    if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
      const error = new Error('Longitude must be between -180 and 180');
      error.name = 'ValidationError';
      throw error;
    }
  }

  // Generate URL-friendly course ID
  const courseId = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${city.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${stateProvince.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${country.toLowerCase()}`;

  // Check if course already exists
  const existingCourse = await queryOne(
    'SELECT id FROM courses WHERE id = $1',
    [courseId],
  );

  if (existingCourse) {
    const error = new Error('A course with this name and location already exists');
    error.name = 'ValidationError';
    throw error;
  }

  // Insert course into database (updated field names)
  const result = await queryOne(
    `INSERT INTO courses (id, name, city, state_province, country, postal_code, hole_count, latitude, longitude, is_user_submitted, approved, submitted_by_id) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
    [
      courseId,
      name,
      city,
      stateProvince.toUpperCase(),
      country.toUpperCase(),
      postalCode,
      holeCount,
      latitude,
      longitude,
      true,
      false,
      userId,
    ],
  );

  // Convert decimal fields to numbers for consistency
  if (result.latitude) {
    result.latitude = parseFloat(result.latitude);
  }
  if (result.longitude) {
    result.longitude = parseFloat(result.longitude);
  }

  return result;
};

export default coursesSubmitService;
