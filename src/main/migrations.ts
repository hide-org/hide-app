import { Umzug } from 'umzug';
import Database from 'better-sqlite3';
import { coreMigrations } from './migrations/core-migrations';

let db: Database.Database;

// Initialize the migration system using the embedded migrations
export const initMigrations = (database: Database.Database) => {
  db = database;
  
  // Create migrations table if it doesn't exist
  db.exec(`CREATE TABLE IF NOT EXISTS migrations (
    name TEXT PRIMARY KEY,
    executed_at INTEGER NOT NULL
  )`);

  // Create a migration system using our embedded migrations
  const migrator = new Umzug({
    migrations: coreMigrations.map(migration => ({
      name: migration.name,
      up: async () => {
        console.log(`Running migration: ${migration.name}`);
        migration.up(db);
      },
      down: async () => {
        console.log(`Reverting migration: ${migration.name}`);
        migration.down(db);
      }
    })),
    storage: {
      // Use a custom storage for better-sqlite3
      async logMigration({ name }) {
        db.prepare('INSERT INTO migrations (name, executed_at) VALUES (?, ?)')
          .run(name, Date.now());
      },
      async unlogMigration({ name }) {
        db.prepare('DELETE FROM migrations WHERE name = ?')
          .run(name);
      },
      async executed() {
        return db.prepare('SELECT name FROM migrations')
          .all()
          .map((row: any) => row.name);
      }
    },
    logger: console,
  });

  return migrator;
};

// Function to run all pending migrations
export const runMigrations = async (migrator: any) => {
  try {
    const pending = await migrator.pending();
    if (pending.length > 0) {
      console.log(`Found ${pending.length} pending migrations. Running...`);
      const migrations = await migrator.up();
      console.log(`Successfully executed ${migrations.length} migrations.`);
      return migrations;
    } else {
      console.log('No pending migrations.');
      return [];
    }
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};