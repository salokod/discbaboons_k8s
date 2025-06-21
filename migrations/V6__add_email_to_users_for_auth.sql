-- Move email from user_profiles to users table for cleaner authentication architecture
-- This consolidates all authentication fields (username, email, password) in one table

-- Step 1: Add email column to users table
ALTER TABLE users 
ADD COLUMN email VARCHAR(255);

-- Step 2: Copy existing emails from user_profiles to users
UPDATE users 
SET email = up.email 
FROM user_profiles up 
WHERE users.id = up.user_id 
AND up.email IS NOT NULL;

-- Step 3: Create unique constraint on email for authentication
ALTER TABLE users 
ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Step 4: Remove email from user_profiles (no longer needed for auth)
ALTER TABLE user_profiles 
DROP COLUMN IF EXISTS email;

-- Step 5: Make email NOT NULL for future records (optional - can be done later)