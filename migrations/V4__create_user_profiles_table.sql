-- migrations/V4__create_user_profiles_table.sql
-- Description: Create user_profiles table with foreign key relationships
-- Author: Spiro
-- Date: 2025-05-25
-- Purpose: Separate user authentication data from profile data with proper relationships

-- This migration implements the normalization strategy:
-- users table = authentication & security data only
-- user_profiles table = user-facing profile information
-- Relationship: One user has exactly one profile (1:1)

-- Step 1: Create user_profiles table with foreign key relationship
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,                                    -- Unique profile ID
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- Foreign key with cascade
    email VARCHAR(255),                                       -- Migrated from users table
    name VARCHAR(100),                                        -- User's display name
    location VARCHAR(100),                                    -- User's location
    bio TEXT,                                                 -- User's biography
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,          -- Profile creation time
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP           -- Last profile update
);

-- Step 2: Ensure one profile per user (1:1 relationship)
CREATE UNIQUE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- Step 3: Migrate existing email data from users to profiles
-- This creates a profile for every existing user
INSERT INTO user_profiles (user_id, email, created_at)
SELECT id, email, created_at FROM users;


-- Step 4: Add sample profile data for existing test users
-- Update profiles with personality data for development and testing

-- Profile for testuser1
UPDATE user_profiles SET 
    name = 'Alice Baboon',
    location = 'Baboon Forest Research Station',
    bio = 'Senior researcher studying baboon social dynamics. Loves bananas and complex algorithms.'
WHERE user_id = (SELECT id FROM users WHERE username = 'testuser1');

-- Profile for testuser2
UPDATE user_profiles SET 
    name = 'Bob Baboon',
    location = 'Banana Valley Tech Hub',
    bio = 'Full-stack developer passionate about cloud infrastructure. Dreams in YAML.'
WHERE user_id = (SELECT id FROM users WHERE username = 'testuser2');

-- Profile for your awesome testbaboon
UPDATE user_profiles SET 
    name = 'The Alpha Baboon',
    location = 'Kubernetes Cluster Tree House',
    bio = 'Master of database migrations and container orchestration. The ultimate test subject.'
WHERE user_id = (SELECT id FROM users WHERE username = 'testbaboon');


-- Step 5: Add performance indexes for common queries
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at);


-- Step 6: Verification queries (for manual testing after migration)
-- Run these manually to verify the migration worked:
-- 
-- 1. Check table structure: \d user_profiles
-- 2. Check relationships: SELECT u.username, p.name, p.email FROM users u JOIN user_profiles p ON u.id = p.user_id;
-- 3. Check foreign key constraint: INSERT INTO user_profiles (user_id, name) VALUES (999, 'Should Fail');
-- 4. Check unique constraint: INSERT INTO user_profiles (user_id, name) VALUES (1, 'Should Also Fail');