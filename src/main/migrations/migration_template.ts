import { Migration } from '../db/migration-manager';

/**
 * TEMPLATE FILE - DO NOT USE DIRECTLY
 * 
 * This is a template for creating new migrations.
 * To create a new migration:
 * 1. Copy this file
 * 2. Rename it to migration_00X.ts (where X is the next number in sequence)
 * 3. Update the version, name and SQL statements
 * 4. Register it in index.ts
 */
export const migration: Migration = {
  // Use the next sequential number (check existing migrations for the latest version)
  version: 0, // CHANGE THIS to the next version number
  
  // Give it a descriptive name (use snake_case)
  name: 'example_migration_name', // CHANGE THIS
  
  // SQL commands to apply the migration
  up: `
    -- Example: Add a column to an existing table
    -- ALTER TABLE table_name ADD COLUMN column_name TEXT;
    
    -- Example: Create a new table
    -- CREATE TABLE IF NOT EXISTS new_table (
    --   id TEXT PRIMARY KEY,
    --   name TEXT NOT NULL,
    --   created_at INTEGER NOT NULL
    -- );
    
    -- REPLACE THESE EXAMPLES with your actual migration SQL
  `
};