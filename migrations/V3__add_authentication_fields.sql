-- migrations/V3__add_authentication_fields.sql
-- Description: Add authentication fields to users table
-- Author: Spiro  
-- Date: 2025-05-25
-- Purpose: Enhance users table for password-based authentication

-- Step 1: Add new authentication columns (nullable initially)
ALTER TABLE users 
ADD COLUMN password_hash TEXT,
ADD COLUMN last_password_change TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Step 2: Populate existing test users with development data
UPDATE users 
SET password_hash = 'dummy_hash_for_development',
    last_password_change = CURRENT_TIMESTAMP
WHERE password_hash IS NULL;

-- Step 3: Make password_hash required for future inserts
ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;

-- Step 4: Add performance index for security queries
CREATE INDEX idx_users_last_password_change ON users(last_password_change);

-- Step 5: Add a new test user with authentication fields
INSERT INTO users (username, email, password_hash, last_password_change) 
VALUES ('testbaboon', 'testbaboon@discbaboons.com', 'baboonpassword', CURRENT_TIMESTAMP);