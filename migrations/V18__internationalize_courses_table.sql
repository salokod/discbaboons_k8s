-- V18: Internationalize courses table for global support
-- This migration adds country support and renames US-specific fields to be more international

-- Add country column (required for international support)
-- Default to 'US' for backward compatibility with existing data
ALTER TABLE courses ADD COLUMN country VARCHAR(2) NOT NULL DEFAULT 'US';

-- Rename state to state_province for international compatibility
-- This supports states (US), provinces (CA), regions (EU), etc.
ALTER TABLE courses RENAME COLUMN state TO state_province;

-- Rename zip to postal_code for international compatibility  
-- This supports ZIP codes (US), postal codes (CA/UK), etc.
ALTER TABLE courses RENAME COLUMN zip TO postal_code;

-- Drop old US-specific indexes
DROP INDEX IF EXISTS idx_courses_state;

-- Create new international indexes for efficient querying
CREATE INDEX idx_courses_country ON courses(country);
CREATE INDEX idx_courses_state_province ON courses(state_province);
CREATE INDEX idx_courses_country_state_province ON courses(country, state_province);
CREATE INDEX idx_courses_country_city ON courses(country, city);

-- Add helpful comments for developers
COMMENT ON COLUMN courses.country IS 'Two-letter ISO country code (e.g., US, CA, AU, GB)';
COMMENT ON COLUMN courses.state_province IS 'State, province, or region within country';
COMMENT ON COLUMN courses.postal_code IS 'ZIP code, postal code, or equivalent for the country';