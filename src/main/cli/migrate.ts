#!/usr/bin/env ts-node
/**
 * Migration CLI tool for Hide app
 * 
 * This script allows developers to manage database migrations.
 * 
 * Usage:
 *   ts-node migrate.ts status - Show migration status
 *   ts-node migrate.ts up     - Apply pending migrations 
 *   ts-node migrate.ts down   - Revert the most recent migration
 */

import path from 'path';
import { app } from 'electron';
import Database from 'better-sqlite3';
import { initMigrations, runMigrations } from '../migrations';

// Ensure this script can run in a non-Electron context
if (!app) {
  // @ts-ignore - Mock app for non-Electron context
  global.app = {
    getPath: () => process.cwd()
  };
}

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);
const migrator = initMigrations(db);

async function main() {
  const [, , command] = process.argv;

  if (!command) {
    console.log('Command required: status, up, or down');
    process.exit(1);
  }

  try {
    switch (command) {
      case 'up':
        // Migrate up to the latest
        const migrations = await runMigrations(migrator);
        if (migrations.length > 0) {
          console.log(`Applied ${migrations.length} migrations successfully!`);
        } else {
          console.log('No pending migrations to apply.');
        }
        break;

      case 'down':
        // Migrate down one step
        try {
          const results = await migrator.down();
          if (results.length > 0) {
            const names = results.map(m => m.name).join(', ');
            console.log(`Reverted migrations: ${names} successfully!`);
          } else {
            console.log('No migrations were reverted.');
          }
        } catch (err) {
          console.log('No migrations to revert or error during revert.');
          console.error(err);
        }
        break;

      case 'status':
        const pending = await migrator.pending();
        const executed = await migrator.executed();
        
        console.log('Executed migrations:');
        if (executed.length === 0) {
          console.log('  None');
        } else {
          executed.forEach(m => console.log(`  ✓ ${m}`));
        }
        
        console.log('\nPending migrations:');
        if (pending.length === 0) {
          console.log('  None');
        } else {
          pending.forEach(m => console.log(`  ⋯ ${m.name}`));
        }
        break;

      default:
        console.log(`Unknown command: ${command}`);
        console.log('Valid commands: status, up, down');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main().catch(console.error);