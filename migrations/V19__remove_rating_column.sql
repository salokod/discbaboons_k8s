-- Remove rating column from courses table
-- This will drop all existing rating data

ALTER TABLE courses DROP COLUMN IF EXISTS rating;

-- Add comment explaining the change
COMMENT ON TABLE courses IS 'Course information without user ratings - ratings removed as they were deemed unnecessary for core functionality';