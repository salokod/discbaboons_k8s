-- migrations/V5__cleanup_users_table.sql
-- Description: Final cleanup - create pure authentication-focused users table
-- Author: Spiro
-- Date: 2025-05-25
-- Purpose: Complete schema normalization by removing redundant columns from users table

-- This migration completes the separation of concerns:
-- users table = pure authentication data only
-- user_profiles table = all user-facing profile information

-- Step 1: Verification before cleanup (comment shows expected result)
-- Verify all email data is safely migrated to profiles:
-- SELECT u.username, u.email as users_email, p.email as profile_email 
-- FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id;
-- Expected: All users should have matching email in both tables

-- Step 2: Remove redundant email column (data now in user_profiles)
ALTER TABLE users DROP COLUMN email;

-- Step 3: Remove updated_at column (authentication data rarely updates)
ALTER TABLE users DROP COLUMN updated_at;

-- Step 4: Verification queries (for manual testing after migration)
-- Run these manually to verify the cleanup worked:
-- 
-- 1. Check clean users table structure: \d users
--    Expected columns: id, username, password_hash, created_at, last_password_change
-- 
-- 2. Verify profiles contain all user data: SELECT * FROM user_profiles LIMIT 3;
--    Expected: All profiles should have email, name, location, bio data
-- 
-- 3. Test authentication query performance: 
--    SELECT id, username, password_hash FROM users WHERE username = 'testbaboon';
--    Expected: Fast query with only authentication fields
-- 
-- 4. Test full user data query with JOIN:
--    SELECT u.username, u.last_password_change, p.name, p.email, p.bio 
--    FROM users u JOIN user_profiles p ON u.id = p.user_id WHERE u.username = 'testbaboon';
--    Expected: Complete user data from both tables