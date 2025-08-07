/**
 * Shared validation utilities for the mobile app
 */

// Email validation regex - matches backend validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid email format
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return EMAIL_REGEX.test(email.trim());
};

/**
 * Detect if input is an email address (proper validation)
 * @param {string} input - Input string to check
 * @returns {boolean} - True if input is a valid email format
 */
const isEmailAddress = (input) => isValidEmail(input);

/**
 * Validate hexadecimal string (for verification codes)
 * @param {string} value - String to validate
 * @param {number} length - Expected length (default: 6)
 * @returns {boolean} - True if valid hexadecimal of specified length
 */
const isValidHexString = (value, length = 6) => {
  if (!value || typeof value !== 'string') {
    return false;
  }
  const hexRegex = new RegExp(`^[0-9A-Fa-f]{${length}}$`);
  return hexRegex.test(value);
};

/**
 * Validate username format
 * @param {string} username - Username to validate
 * @returns {boolean} - True if valid username format
 */
const isValidUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return false;
  }
  const trimmed = username.trim();
  return trimmed.length >= 4 && trimmed.length <= 20 && /^[a-zA-Z0-9]+$/.test(trimmed);
};

/**
 * Validate password format
 * @param {string} password - Password to validate
 * @returns {boolean} - True if valid password format
 */
const isValidPassword = (password) => {
  if (!password || typeof password !== 'string') {
    return false;
  }
  return password.length >= 8 && password.length <= 32;
};

module.exports = {
  EMAIL_REGEX,
  isValidEmail,
  isEmailAddress,
  isValidHexString,
  isValidUsername,
  isValidPassword,
};
