-- Create rounds table for disc golf round management
CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_id INTEGER NOT NULL,
  course_id VARCHAR(100) NOT NULL,
  name VARCHAR(200) NOT NULL,
  start_time TIMESTAMP NOT NULL DEFAULT NOW(), -- Always current time, no future rounds
  starting_hole INTEGER NOT NULL DEFAULT 1, -- Which hole to start on (1-N)
  is_private BOOLEAN DEFAULT false,
  skins_enabled BOOLEAN DEFAULT false,
  skins_value DECIMAL(10,2), -- Per hole skins value, carries over on ties
  status VARCHAR(20) DEFAULT 'in_progress', -- in_progress, completed, cancelled
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT,
  CONSTRAINT check_starting_hole CHECK (starting_hole > 0 AND starting_hole <= 50)
);

CREATE INDEX idx_rounds_created_by ON rounds(created_by_id);
CREATE INDEX idx_rounds_course_id ON rounds(course_id);
CREATE INDEX idx_rounds_start_time ON rounds(start_time);
CREATE INDEX idx_rounds_status ON rounds(status);
CREATE INDEX idx_rounds_starting_hole ON rounds(starting_hole);

-- Add comments for clarity
COMMENT ON COLUMN rounds.start_time IS 'Round start time - always set to creation time, no future scheduling';
COMMENT ON COLUMN rounds.starting_hole IS 'Which hole number to start the round on (default 1)';
COMMENT ON COLUMN rounds.skins_value IS 'Dollar amount per hole for skins game, carries over on ties';