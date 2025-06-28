CREATE TABLE bags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  is_friends_visible BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_bags_user_id ON bags(user_id);
CREATE INDEX idx_bags_is_public ON bags(is_public);
CREATE INDEX idx_bags_is_friends_visible ON bags(is_friends_visible);