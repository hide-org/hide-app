import { Migration } from '../db/migration-manager';

/**
 * Initial migration to set up the base tables
 */
export const migration: Migration = {
  version: 1,
  name: 'initial_setup',
  up: `
    -- Create projects table
    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        description TEXT
    );

    -- Create conversations table
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

    -- Create user_settings table
    CREATE TABLE IF NOT EXISTS user_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        model_provider TEXT NOT NULL,
        provider_settings TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
    );

    -- Create tasks table
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

    -- Create user_account table
    CREATE TABLE IF NOT EXISTS user_account (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        user_id TEXT NOT NULL
    );
  `
};