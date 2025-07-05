-- Add fields for enhanced lost disc tracking
ALTER TABLE bag_contents 
ADD COLUMN lost_notes VARCHAR(255) NULL,
ADD COLUMN lost_at TIMESTAMP NULL;

-- Add index for lost_at for efficient querying of recently lost discs
CREATE INDEX idx_bag_contents_lost_at ON bag_contents(lost_at);

-- Add comment for documentation
COMMENT ON COLUMN bag_contents.lost_notes IS 'Notes about where/how the disc was lost (e.g., "prospect park hole 12")';
COMMENT ON COLUMN bag_contents.lost_at IS 'Timestamp when the disc was marked as lost';