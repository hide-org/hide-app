import { Migration } from '../db/migration-manager';
import { migration as migration001 } from './migration_001';
import { migration as migration002 } from './migration_002';

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
  migration002,
  // Add more migrations here as needed
];