-- Create side_bets table for disc golf round betting
CREATE TABLE side_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  bet_type VARCHAR(200) NOT NULL, -- User-defined bet type (e.g., "Closest to Pin", "Longest Drive", etc.)
  hole_number INTEGER, -- NULL for round-long bets
  created_by_id UUID NOT NULL, -- References round_players.id
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  cancelled_at TIMESTAMP, -- Track when bet was cancelled
  cancelled_by_id UUID, -- References round_players.id who cancelled
  FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_id) REFERENCES round_players(id) ON DELETE CASCADE,
  FOREIGN KEY (cancelled_by_id) REFERENCES round_players(id) ON DELETE CASCADE,
  CONSTRAINT check_amount_positive CHECK (amount > 0),
  CONSTRAINT check_hole_number CHECK (hole_number IS NULL OR (hole_number > 0 AND hole_number <= 50))
);

-- Create indexes for performance
CREATE INDEX idx_side_bets_round_id ON side_bets(round_id);
CREATE INDEX idx_side_bets_hole_number ON side_bets(hole_number);
CREATE INDEX idx_side_bets_created_by_id ON side_bets(created_by_id);

-- Add comments for documentation
COMMENT ON TABLE side_bets IS 'Side bets created by players during a round (e.g., closest to pin, longest drive)';
COMMENT ON COLUMN side_bets.bet_type IS 'User-defined bet type as free-form text';
COMMENT ON COLUMN side_bets.hole_number IS 'Specific hole number for hole-based bets, NULL for round-long bets';
COMMENT ON COLUMN side_bets.cancelled_at IS 'Timestamp when bet was cancelled, NULL if active';
COMMENT ON COLUMN side_bets.cancelled_by_id IS 'Player who cancelled the bet';