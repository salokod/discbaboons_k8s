# Database Migration Plan

## Current State
- ✅ **V1**: Flyway baseline (automatically created)
- ✅ **V2**: Basic users table (created during Flyway learning)

## Target Schema Evolution

### V3: Enhance Users Table for Authentication
- Add `password_hash` column (TEXT NOT NULL)
- Add `last_password_change` column (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- Remove `email` column (moving to profiles)
- Remove `updated_at` column (not needed for auth table)

### V4: Create User Profiles Table
- Create `user_profiles` table with foreign key to users
- Add profile-specific fields: name, location, bio
- Add proper indexes for performance
- Add cascade delete constraint

### V5: Data Migration (if needed)
- Migrate any existing email data to profiles
- Add test profiles for existing users

## Migration Strategy
1. **Backwards Compatible**: Each migration maintains API compatibility
2. **Small Changes**: One logical change per migration
3. **Rollback Plan**: Document how to reverse each change
4. **Test Data**: Include sample data for development