# Database Migration System

This directory contains database migrations for the Hide app SQLite database.

## How Migrations Work

- Migrations are applied in order based on their version number
- The database's `user_version` PRAGMA is used to track the current schema version
- Migrations are applied automatically when the application starts
- Only migrations with a version higher than the current `user_version` will be applied
- Each applied migration is recorded in the `_migrations` table

## Adding a New Migration

1. Create a new file in this directory with the naming pattern `migration_XXX.ts` where XXX is the next sequential number
2. Each migration file should export a `migration` object with `version`, `name`, and `up` properties:

```typescript
import { Migration } from '../db/migration-manager';

export const migration: Migration = {
  version: X, // Sequential version number
  name: 'descriptive_name', // A descriptive name for the migration
  up: `
    -- SQL statements to apply the migration
    ALTER TABLE your_table ADD COLUMN new_column TEXT;
  `
};
```

3. Register the migration in `index.ts` by importing it and adding it to the `migrations` array

## Guidelines for Writing Migrations

- Each migration should be a single, atomic change to the schema
- Make migrations idempotent where possible (use `IF NOT EXISTS`, etc.)
- Use transactions for complex migrations (already handled by the migration manager)
- Test migrations thoroughly before deploying
- Once a migration is deployed to users, never modify it; create a new migration instead