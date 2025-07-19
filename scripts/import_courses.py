#!/usr/bin/env python3
import csv
import sys

def escape_sql_string(value):
    """Escape single quotes for SQL"""
    if not value:
        return ""
    return value.replace("'", "''")

def main():
    try:
        with open("course-data.csv") as f:
            reader = csv.DictReader(f)
            with open("courses_seed.sql", "w") as out:
                for row in reader:
                    course_id = escape_sql_string(row.get("id", "").replace('"', '').strip())
                    name = escape_sql_string(row.get("name", "").replace('"', '').strip())
                    city = escape_sql_string(row.get("city", "").replace('"', '').strip())
                    state_province = escape_sql_string(row.get("state", "").replace('"', '').strip())
                    country = escape_sql_string(row.get("country", "US").replace('"', '').strip())  # Default to US
                    postal_code = row.get("zip", "").replace('"', '').strip()
                    hole_count = row.get("holeCount", "18").strip()
                    latitude = row.get("latitude", "").strip()
                    longitude = row.get("longitude", "").strip()
                    
                    # Validate hole_count
                    if not hole_count or not hole_count.isdigit():
                        hole_count = "18"
                    
                    # Handle optional fields
                    postal_code_val = f"'{escape_sql_string(postal_code)}'" if postal_code else "NULL"
                    lat_val = latitude if (latitude and latitude.replace("-", "").replace(".", "").isdigit()) else "NULL"
                    lon_val = longitude if (longitude and longitude.replace("-", "").replace(".", "").isdigit()) else "NULL"
                    
                    # Only insert if we have required fields
                    if course_id and name and city and state_province:
                        sql = f"INSERT INTO courses (id, name, city, state_province, country, postal_code, hole_count, latitude, longitude, is_user_submitted, approved, created_at, updated_at) VALUES ('{course_id}', '{name}', '{city}', '{state_province}', '{country}', {postal_code_val}, {hole_count}, {lat_val}, {lon_val}, FALSE, TRUE, NOW(), NOW());\n"
                        out.write(sql)
        
        print("Successfully generated courses_seed.sql")
        return 0
    
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1

if __name__ == "__main__":
    sys.exit(main())