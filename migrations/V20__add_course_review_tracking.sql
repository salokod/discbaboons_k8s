-- Add reviewed_at and reviewed_by fields to track admin review status
ALTER TABLE courses ADD COLUMN reviewed_at TIMESTAMP NULL;
ALTER TABLE courses ADD COLUMN reviewed_by_id INTEGER NULL;

-- Add foreign key for reviewed_by_id
ALTER TABLE courses ADD CONSTRAINT fk_courses_reviewed_by 
  FOREIGN KEY (reviewed_by_id) REFERENCES users(id) ON DELETE SET NULL;

-- Create index for pending course queries (unreviewed user submissions)
CREATE INDEX idx_courses_pending ON courses(is_user_submitted, reviewed_at) 
  WHERE is_user_submitted = true AND reviewed_at IS NULL;

-- Add comments for clarity
COMMENT ON COLUMN courses.reviewed_at IS 'Timestamp when admin reviewed the course (approved or denied)';
COMMENT ON COLUMN courses.reviewed_by_id IS 'Admin user ID who reviewed the course';