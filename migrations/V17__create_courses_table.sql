-- Create courses table for disc golf course management
CREATE TABLE courses (
  id VARCHAR(100) PRIMARY KEY, -- Use CSV id format like "adventist-discovery-park"
  name VARCHAR(200) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  zip VARCHAR(10),
  hole_count INTEGER NOT NULL,
  rating DECIMAL(3,1), -- Course rating like 4.5
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  is_user_submitted BOOLEAN DEFAULT false,
  approved BOOLEAN DEFAULT true, -- CSV courses pre-approved
  submitted_by_id INTEGER, -- NULL for CSV courses
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (submitted_by_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX idx_courses_state ON courses(state);
CREATE INDEX idx_courses_city ON courses(city);
CREATE INDEX idx_courses_approved ON courses(approved);
CREATE INDEX idx_courses_is_user_submitted ON courses(is_user_submitted);
CREATE INDEX idx_courses_location ON courses(latitude, longitude);