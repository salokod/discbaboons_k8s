/**
 * Environment Configuration
 * Handles different API base URLs for development and production
 */

import { Platform } from 'react-native';

const isDevelopment = __DEV__;

export const config = {
  development: {
    // Local development - backend runs on port 8080
    // Use 10.0.2.2 for Android emulator to reach host machine's localhost
    API_BASE_URL: Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080',
    LOG_LEVEL: 'debug',
  },
  production: {
    // Production - HTTPS domain
    API_BASE_URL: 'https://discbaboons.spirojohn.com',
    LOG_LEVEL: 'warn',
  },
};

// Export current environment config
export const API_BASE_URL = isDevelopment
  ? config.development.API_BASE_URL
  : config.production.API_BASE_URL;

export const LOG_LEVEL = isDevelopment
  ? config.development.LOG_LEVEL
  : config.production.LOG_LEVEL;

// For debugging
export const CURRENT_ENV = isDevelopment ? 'development' : 'production';
