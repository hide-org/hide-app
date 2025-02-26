import Database from 'better-sqlite3';

/**
 * Interface for a database migration
 */
export interface Migration {
  version: number;
  name: string;
  up: string;
}

/**
 * Manages schema migrations for the application's SQLite database
 */
export class MigrationManager {
  private db: Database.Database;
  private migrations: Migration[] = [];

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Register migrations to be applied
   * @param migrations List of migrations to register
   */
  registerMigrations(migrations: Migration[]) {
    // Sort migrations by version to ensure they're applied in order
    this.migrations = migrations.sort((a, b) => a.version - b.version);
  }

  /**
   * Initialize the migration table if it doesn't exist
   */
  private initMigrationTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY,
        version INTEGER NOT NULL,
        name TEXT NOT NULL,
        applied_at INTEGER NOT NULL
      )
    `);
  }

  /**
   * Get the current database version
   * @returns The current version number from user_version PRAGMA
   */
  private getCurrentVersion(): number {
    const result = this.db.pragma('user_version', { simple: true });
    return result as number;
  }

  /**
   * Set the database version
   * @param version New version to set
   */
  private setCurrentVersion(version: number): void {
    this.db.pragma(`user_version = ${version}`);
  }

  /**
   * Apply a single migration
   * @param migration The migration to apply
   */
  private applyMigration(migration: Migration): void {
    console.log(`Applying migration ${migration.version}: ${migration.name}`);
    
    // Begin transaction
    this.db.exec('BEGIN TRANSACTION');
    
    try {
      // Run the migration SQL
      this.db.exec(migration.up);
      
      // Update the user_version pragma
      this.setCurrentVersion(migration.version);
      
      // Record the migration in the migrations table
      const stmt = this.db.prepare(
        'INSERT INTO _migrations (version, name, applied_at) VALUES (?, ?, ?)'
      );
      stmt.run(migration.version, migration.name, Date.now());
      
      // Commit the transaction
      this.db.exec('COMMIT');
      
      console.log(`Migration ${migration.version} applied successfully`);
    } catch (error) {
      // Rollback the transaction if anything fails
      this.db.exec('ROLLBACK');
      console.error(`Migration ${migration.version} failed:`, error);
      throw error;
    }
  }

  /**
   * Apply all pending migrations
   * @returns Number of migrations applied
   */
  migrateUp(): number {
    this.initMigrationTable();
    
    // Get current version
    const currentVersion = this.getCurrentVersion();
    console.log(`Current database version: ${currentVersion}`);
    
    // Find migrations that need to be applied
    const pendingMigrations = this.migrations.filter(m => m.version > currentVersion);
    
    if (pendingMigrations.length === 0) {
      console.log('Database schema is up to date');
      return 0;
    }
    
    console.log(`Applying ${pendingMigrations.length} pending migrations...`);
    
    // Apply each migration in order
    for (const migration of pendingMigrations) {
      this.applyMigration(migration);
    }
    
    console.log(`Database migrated to version ${pendingMigrations[pendingMigrations.length - 1].version}`);
    return pendingMigrations.length;
  }
}