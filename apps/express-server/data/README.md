# Express Server Data Files

This directory contains data files used for seeding the database with initial content.

## Files

### `course-data.csv`
- **Purpose**: CSV file containing 7,000+ disc golf courses for seeding the `courses` table
- **Used by**: `scripts/import_courses.py` and `rebuild-apps.sh`
- **Format**: CSV with columns: id, name, city, state, country, zip, holeCount, latitude, longitude
- **Source**: Disc golf course database for production use

### `disc-data.json`
- **Purpose**: JSON file containing disc master data for seeding the `disc_master` table
- **Used by**: Inline Python script in `rebuild-apps.sh`
- **Format**: JSON array with disc objects containing brand, title, speed, glide, turn, fade
- **Note**: This file is in `.gitignore` as it may contain proprietary data

### `PRODUCTION_COURSE_IMPORT.sql`
- **Purpose**: Production SQL file containing 7,000+ INSERT statements for courses
- **Used by**: Manual import for production database setup
- **Format**: Raw SQL INSERT statements
- **Note**: Alternative to CSV import for direct SQL execution

## Usage

These files are automatically processed during local development setup:

```bash
# Triggered by rebuild-apps.sh
./rebuild-apps.sh

# Data seeding happens in steps 15.5 and 15.6:
# Step 15.5: Loads disc-data.json into disc_master table
# Step 15.6: Loads course-data.csv into courses table
```

## Development Notes

- Files are referenced from project root directory in build scripts
- The Python import script generates temporary SQL files that are executed in Kubernetes pods
- Course data provides a realistic dataset for testing location-based features
- Disc data enables comprehensive bag management and disc selection features

## File Locations

These files were moved from the project root to organize data files with the service that uses them:
- `course-data.csv` (moved from root)
- `disc-data.json` (moved from root) 
- `PRODUCTION_COURSE_IMPORT.sql` (moved from `apps/express-server/`)

All import scripts have been updated to reference the new locations.