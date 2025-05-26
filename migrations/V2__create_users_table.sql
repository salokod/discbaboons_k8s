-- migrations/V1__create_users_table.sql
-- Description: Create the basic users table for the discbaboons application
-- Author: Spiro
-- Date: Today

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);

-- Insert some test data
INSERT INTO users (username, email) VALUES 
    ('testuser1', 'test1@discbaboons.com'),
    ('testuser2', 'test2@discbaboons.com');