# Hide App Database Migration System

This directory contains the migration system for the Hide app's SQLite database.

## Overview

Hide uses [Umzug](https://github.com/sequelize/umzug) as its migration framework, customized to work with the better-sqlite3 library. The migration system allows you to:

- Check migration status
- Apply pending migrations
- Revert applied migrations

## Migration Architecture

Hide takes a simplified approach to migrations:

1. **Core migrations are embedded in the application code** (`core-migrations.ts`), ensuring they're properly bundled by webpack and always consistent with the application version.

2. **Migrations run automatically** when the app starts, ensuring the database schema is always up to date.

3. **Migration history is stored in the `migrations` table** in the SQLite database.

## Core Migrations

The core migrations that ship with Hide include:

1. `00-initial-schema`: Creates the base tables (projects, conversations, tasks, etc.)

Additional migrations will be added as new features are developed.

## Using the Migration CLI

Hide provides several npm scripts to help manage migrations:

### Check migration status

```bash
npm run migrate:status
```

This shows which migrations have been applied and which are pending.

### Apply pending migrations

```bash
npm run migrate:up
```

This applies all pending migrations.

### Revert a migration

```bash
npm run migrate:down
```

This reverts the most recently applied migration.

## How Migrations Work

1. When the app starts, it initializes the database and migration system
2. The migration system checks which migrations have already been applied
3. It then applies any pending migrations in sequence
4. After migrations complete, additional setup like creating a default project occurs

## Adding New Migrations

To add a new migration for a database schema change:

1. Edit the `core-migrations.ts` file
2. Add a new migration object to the `coreMigrations` array with:
   - A sequential name (e.g., "01-add-something")
   - An `up` function that performs the schema change
   - A `down` function that reverts the change

Example:

```typescript
{
  name: "01-add-conversation-flags",
  up: (db: Database.Database) => {
    db.exec(`
      ALTER TABLE conversations 
      ADD COLUMN is_flagged INTEGER NOT NULL DEFAULT 0;
    `);
  },
  down: (db: Database.Database) => {
    // SQLite doesn't support DROP COLUMN directly, so we'd need
    // to recreate the table without the column in a real scenario
    console.log('Warning: Not removing column because SQLite has limited ALTER TABLE support');
  }
}
```

## Best Practices

1. Always include both `up` and `down` methods
2. Use `IF NOT EXISTS` for creating objects and `IF EXISTS` for dropping them
3. Make migrations idempotent when possible
4. Test migrations thoroughly before releasing to users