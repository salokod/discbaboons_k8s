-- V7__expand_location_fields.sql
-- Description: Expand location field into country, state/province, and city for better demographics
-- Author: Spiro Dokolas  
-- Date: 2025-06-20

-- Step 1: Add new geographic fields
ALTER TABLE user_profiles 
ADD COLUMN country VARCHAR(100),
ADD COLUMN state_province VARCHAR(100), 
ADD COLUMN city VARCHAR(100);

-- Step 2: Migrate existing location data to country field (best guess)
UPDATE user_profiles 
SET country = location 
WHERE location IS NOT NULL AND location != '';

-- Step 3: Remove old location field
ALTER TABLE user_profiles 
DROP COLUMN location;

-- Step 4: Add indexes for geographic queries
CREATE INDEX idx_user_profiles_country ON user_profiles(country);
CREATE INDEX idx_user_profiles_state_province ON user_profiles(state_province);