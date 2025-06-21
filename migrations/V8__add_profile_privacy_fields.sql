-- V8__add_profile_privacy_fields.sql
-- Description: Add privacy fields to user_profiles for public profile controls

ALTER TABLE user_profiles
ADD COLUMN isNamePublic BOOLEAN DEFAULT FALSE,
ADD COLUMN isBioPublic BOOLEAN DEFAULT FALSE,
ADD COLUMN isLocationPublic BOOLEAN DEFAULT FALSE;