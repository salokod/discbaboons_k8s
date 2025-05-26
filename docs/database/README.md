# Database Documentation

## Overview
Authentication system for DiscBaboons application with separated concerns between authentication data and user profiles.

## Schema Files
- [`schema.dbml`](schema.dbml) - Complete database schema in DBML format
- [`migration-plan.md`](migration-plan.md) - Step-by-step migration strategy

## Design Principles
- **Separation of Concerns**: Authentication data separate from profile data
- **Data Integrity**: Foreign key constraints with cascade delete
- **Performance**: Proper indexing on commonly queried fields
- **Security**: Password hashing, no plain text storage

## Quick Start
1. View the complete schema: [`schema.dbml`](schema.dbml)
2. Check migration progress: `SELECT * FROM flyway_schema_history;`
3. See current tables: `\dt` in psql

## Schema Visualization
You can visualize the DBML schema at: https://dbdiagram.io/
1. Copy the contents of `schema.dbml`
2. Paste into dbdiagram.io
3. See visual representation of your database