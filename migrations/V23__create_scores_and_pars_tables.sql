-- V23__create_scores_and_pars_tables.sql
-- Creates the scoring system with separate par management

-- Round hole pars table (separate from scores)
CREATE TABLE round_hole_pars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL,
  hole_number INTEGER NOT NULL,
  par INTEGER NOT NULL DEFAULT 3, -- Default par 3 for disc golf
  set_by_player_id UUID NOT NULL, -- Who set/changed the par
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
  FOREIGN KEY (set_by_player_id) REFERENCES round_players(id) ON DELETE CASCADE,
  CONSTRAINT check_par CHECK (par > 0 AND par <= 10),
  CONSTRAINT check_hole_number CHECK (hole_number > 0 AND hole_number <= 50)
);

CREATE UNIQUE INDEX idx_round_hole_pars_unique ON round_hole_pars(round_id, hole_number);
CREATE INDEX idx_round_hole_pars_round_id ON round_hole_pars(round_id);

-- Scores table (par removed - looked up from round_hole_pars)
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL,
  player_id UUID NOT NULL, -- References round_players.id
  hole_number INTEGER NOT NULL,
  strokes INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES round_players(id) ON DELETE CASCADE,
  CONSTRAINT check_hole_number CHECK (hole_number > 0 AND hole_number <= 50),
  CONSTRAINT check_strokes CHECK (strokes > 0 AND strokes <= 20)
);

CREATE INDEX idx_scores_round_id ON scores(round_id);
CREATE INDEX idx_scores_player_id ON scores(player_id);
CREATE INDEX idx_scores_hole_number ON scores(hole_number);
CREATE UNIQUE INDEX idx_scores_unique ON scores(round_id, player_id, hole_number);

-- Comments for clarity
COMMENT ON TABLE round_hole_pars IS 'Par values for each hole in a round, editable by any player';
COMMENT ON COLUMN round_hole_pars.par IS 'Par value for this hole (default 3, editable during round)';
COMMENT ON COLUMN round_hole_pars.set_by_player_id IS 'Player who last set/changed the par value';
COMMENT ON TABLE scores IS 'Player scores per hole (par looked up from round_hole_pars table)';