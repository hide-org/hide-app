import { homedir } from 'os';
import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';

// Define the migration interface
export interface Migration {
  name: string;
  up: (db: Database.Database) => void;
  down: (db: Database.Database) => void;
}

// Core migrations that define the database schema
export const coreMigrations: Migration[] = [
  // 00-initial-schema
  {
    name: "00-initial-schema",
    up: (db: Database.Database) => {
      // Create the initial database schema
      db.exec(`
        -- Projects table
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          path TEXT NOT NULL,
          description TEXT
        );

        -- Conversations table
        CREATE TABLE IF NOT EXISTS conversations (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          messages TEXT NOT NULL,
          projectId TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive')),
          createdAt INTEGER NOT NULL,
          updatedAt INTEGER NOT NULL,
          FOREIGN KEY (projectId) REFERENCES projects(id)
        );

        -- User settings table
        CREATE TABLE IF NOT EXISTS user_settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          model_provider TEXT NOT NULL,
          provider_settings TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );

        -- Tasks table
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
          metadata TEXT NOT NULL,
          projectId TEXT NOT NULL,
          conversationId TEXT,
          createdAt INTEGER NOT NULL,
          updatedAt INTEGER NOT NULL,
          FOREIGN KEY (projectId) REFERENCES projects(id),
          FOREIGN KEY (conversationId) REFERENCES conversations(id)
        );

        -- User account table
        CREATE TABLE IF NOT EXISTS user_account (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          user_id TEXT NOT NULL
        );
      `);
    },
    down: (db: Database.Database) => {
      // Drop all tables in reverse order of creation to respect foreign key constraints
      db.exec(`
        DROP TABLE IF EXISTS user_account;
        DROP TABLE IF EXISTS tasks;
        DROP TABLE IF EXISTS user_settings;
        DROP TABLE IF EXISTS conversations;
        DROP TABLE IF EXISTS projects;
      `);
    }
  }
  // Add future migrations here as needed
];

// Helper function to create default project if needed
export const insertDefaultProjectIfNeeded = (db: Database.Database): void => {
  try {
    // Check if projects table exists and is empty
    const tableExists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='projects'`).get();
    
    if (!tableExists) {
      console.debug('Projects table does not exist yet, skipping default project insertion');
      return;
    }
    
    const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
    if (projectCount.count === 0) {
      console.debug('No projects found, creating default general project');
      const defaultProjects = [
        {
          id: uuidv4(),
          name: "general",
          path: homedir(),
          description: "Default project for general help on my machine",
        },
      ];

      const insert = db.prepare('INSERT INTO projects (id, name, path, description) VALUES (?, ?, ?, ?)');
      defaultProjects.forEach(project => {
        insert.run(project.id, project.name, project.path, project.description);
      });
      console.debug('Default project created successfully');
    }
  } catch (error) {
    console.error('Error inserting default project:', error);
  }
};