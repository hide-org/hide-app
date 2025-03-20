import { Migration } from '../db/migration-manager';

/**
 * Migration to remove the model_provider column from user_settings table
 */
export const migration: Migration = {
  // The next version after the initial migration
  version: 2,

  // A descriptive name
  name: 'remove_model_provider_from_settings',

  // The SQL to execute for this migration
  up: `
    -- Create a temporary table without the model_provider column
    CREATE TABLE user_settings_temp (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      provider_settings TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    
    -- Copy data from the old table to the new one
    INSERT INTO user_settings_temp (id, provider_settings, created_at, updated_at)
    SELECT id, provider_settings, created_at, updated_at FROM user_settings;
    
    -- Drop the old table
    DROP TABLE user_settings;
    
    -- Rename the new table to the original name
    ALTER TABLE user_settings_temp RENAME TO user_settings;
  `
};
