-- Create side_bet_participants table for tracking who joined each bet
CREATE TABLE side_bet_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  side_bet_id UUID NOT NULL,
  player_id UUID NOT NULL, -- References round_players.id
  is_winner BOOLEAN DEFAULT false,
  won_at TIMESTAMP, -- Timestamp when declared as winner
  declared_by_id UUID, -- References round_players.id who declared the winner
  joined_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (side_bet_id) REFERENCES side_bets(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES round_players(id) ON DELETE CASCADE,
  FOREIGN KEY (declared_by_id) REFERENCES round_players(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_side_bet_participants_side_bet_id ON side_bet_participants(side_bet_id);
CREATE INDEX idx_side_bet_participants_player_id ON side_bet_participants(player_id);
CREATE UNIQUE INDEX idx_side_bet_participants_unique ON side_bet_participants(side_bet_id, player_id);

-- Add comments for documentation
COMMENT ON TABLE side_bet_participants IS 'Players participating in each side bet';
COMMENT ON COLUMN side_bet_participants.is_winner IS 'Whether this participant won the bet';
COMMENT ON COLUMN side_bet_participants.won_at IS 'Timestamp when participant was declared winner';
COMMENT ON COLUMN side_bet_participants.declared_by_id IS 'Player who declared this participant as winner';