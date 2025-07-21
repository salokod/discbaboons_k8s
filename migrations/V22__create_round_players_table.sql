CREATE TABLE round_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL,
  user_id INTEGER, -- NULL for guest players
  guest_name VARCHAR(100), -- Name for guest players
  is_guest BOOLEAN DEFAULT false,
  joined_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT check_player_type CHECK (
    (is_guest = true AND guest_name IS NOT NULL AND user_id IS NULL) OR
    (is_guest = false AND user_id IS NOT NULL AND guest_name IS NULL)
  )
);

CREATE INDEX idx_round_players_round_id ON round_players(round_id);
CREATE INDEX idx_round_players_user_id ON round_players(user_id);
CREATE UNIQUE INDEX idx_round_players_unique_user ON round_players(round_id, user_id) WHERE user_id IS NOT NULL;