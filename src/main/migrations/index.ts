import { Migration } from '../db/migration-manager';
import { migration as migration001 } from './migration_001';

/**
 * Collection of all migrations in the system
 * 
 * When adding a new migration:
 * 1. Create a new file using migration_template.ts as a reference
 * 2. Import it here
 * 3. Add it to this array
 */
export const migrations: Migration[] = [
  migration001,
  // Add more migrations here as needed
  // Example: migration002,
];