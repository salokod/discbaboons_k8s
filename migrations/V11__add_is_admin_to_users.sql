-- V11__add_is_admin_to_users.sql
-- Description: Add isAdmin boolean to users table and set all existing users to false

ALTER TABLE users
ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE users SET is_admin = FALSE WHERE is_admin IS NULL;