-- Add denial tracking columns to disc_master table
-- This enables admins to deny inappropriate disc submissions with optional reasons

ALTER TABLE disc_master 
ADD COLUMN denied BOOLEAN DEFAULT FALSE,
ADD COLUMN denied_reason TEXT,
ADD COLUMN denied_at TIMESTAMP,
ADD COLUMN denied_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Index for efficient pending disc queries (approved = false AND denied = false)
-- This optimizes the GET /api/discs/pending endpoint
CREATE INDEX idx_disc_master_pending ON disc_master (approved, denied) 
WHERE approved = FALSE AND denied = FALSE;

-- Index for denied discs queries (for future admin audit features)
CREATE INDEX idx_disc_master_denied ON disc_master (denied, denied_at) 
WHERE denied = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN disc_master.denied IS 'TRUE if disc submission was denied by admin';
COMMENT ON COLUMN disc_master.denied_reason IS 'Optional reason provided by admin for denial';
COMMENT ON COLUMN disc_master.denied_at IS 'Timestamp when disc was denied';
COMMENT ON COLUMN disc_master.denied_by_id IS 'ID of admin user who denied the disc';