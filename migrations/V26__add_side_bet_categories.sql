-- Add bet_category column to side_bets table for analytics
ALTER TABLE side_bets 
ADD COLUMN bet_category VARCHAR(50);

-- Add index for category queries
CREATE INDEX idx_side_bets_category ON side_bets(bet_category);

-- Add comments for documentation
COMMENT ON COLUMN side_bets.bet_category IS 'Standardized bet category for analytics. NULL for legacy bets, will be pattern-matched later. Validation happens in application layer for flexibility.';

-- Note: Existing bets will have NULL category
-- They will be categorized later via pattern matching or remain as 'custom'
-- Categories are validated in the service layer, not database, for easier extensibility