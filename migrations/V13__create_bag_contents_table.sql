-- Create bag_contents table for storing discs in bags with personal data
-- Supports multiple instances of same disc, personal tracking data, and loss management

CREATE TABLE bag_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INT NOT NULL,
  bag_id UUID,
  disc_id UUID NOT NULL,
  notes VARCHAR(255),
  weight DECIMAL(4,1),
  condition VARCHAR(20),
  plastic_type VARCHAR(50),  -- Champion, DX, Star, etc.
  color VARCHAR(50),         -- Red, Blue, Orange, etc.
  is_lost BOOLEAN DEFAULT false,  -- Mark disc as lost instead of deleting
  added_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (bag_id) REFERENCES bags(id) ON DELETE SET NULL,
  FOREIGN KEY (disc_id) REFERENCES disc_master(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_bag_contents_user_id ON bag_contents(user_id);
CREATE INDEX idx_bag_contents_bag_id ON bag_contents(bag_id);
CREATE INDEX idx_bag_contents_disc_id ON bag_contents(disc_id);
CREATE INDEX idx_bag_contents_is_lost ON bag_contents(is_lost);

-- Add constraints for data validation
ALTER TABLE bag_contents ADD CONSTRAINT chk_weight_range CHECK (weight IS NULL OR (weight >= 1.0 AND weight <= 300.0));
ALTER TABLE bag_contents ADD CONSTRAINT chk_condition_values CHECK (condition IN ('new', 'good', 'worn', 'beat-in'));