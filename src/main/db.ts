import Database from 'better-sqlite3';
import { app, ipcMain } from 'electron';
import path from 'path';
import { homedir } from 'os';
import { v4 as uuidv4 } from 'uuid';
import { Conversation, Project } from '../types';
import { UserSettings, DEFAULT_USER_SETTINGS } from '../types/settings';

let db: Database.Database;

export const initializeDatabase = () => {
  if (db) return;

  const dbPath = path.join(app.getPath('userData'), 'database.sqlite');
  db = new Database(dbPath);

  // Create projects table if it doesn't exist
  db.exec(`
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            path TEXT NOT NULL,
            description TEXT
        )
    `);

  // Create conversations table if it doesn't exist
  db.exec(`
        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            messages TEXT NOT NULL,
            projectId TEXT NOT NULL,
            createdAt INTEGER NOT NULL,
            updatedAt INTEGER NOT NULL,
            FOREIGN KEY (projectId) REFERENCES projects(id)
        )
    `);

  // Create user_settings table if it doesn't exist
  db.exec(`
        CREATE TABLE IF NOT EXISTS user_settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            model_provider TEXT NOT NULL,
            provider_settings TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        )
    `);

  // Insert default projects if table is empty
  const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
  if (projectCount.count === 0) {
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
  }

  // Insert default settings if table is empty
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM user_settings').get() as { count: number };
  if (settingsCount.count === 0) {
    const insert = db.prepare(`
      INSERT INTO user_settings (
        id, 
        model_provider, 
        provider_settings, 
        created_at, 
        updated_at
      ) VALUES (?, ?, ?, ?, ?)
    `);
    
    insert.run(
      1,
      DEFAULT_USER_SETTINGS.model_provider,
      JSON.stringify(DEFAULT_USER_SETTINGS.provider_settings),
      DEFAULT_USER_SETTINGS.created_at,
      DEFAULT_USER_SETTINGS.updated_at
    );
  }
};

export const getAllProjects = (): Project[] => {
  const stmt = db.prepare('SELECT * FROM projects');
  return stmt.all() as Project[];
};

export const getProjectById = (id: string): Project | undefined => {
  const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
  return stmt.get(id) as Project | undefined;
};

export const createProject = (project: Project): void => {
  const stmt = db.prepare('INSERT INTO projects (id, name, path, description) VALUES (?, ?, ?, ?)');
  stmt.run(project.id, project.name, project.path, project.description);
};

export const updateProject = (project: Project): void => {
  const stmt = db.prepare('UPDATE projects SET name = ?, path = ?, description = ? WHERE id = ?');
  stmt.run(project.name, project.path, project.description, project.id);
};

export const deleteProject = (id: string): void => {
  const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
  stmt.run(id);
};

export const getAllConversations = (projectId: string): Conversation[] => {
  const stmt = db.prepare('SELECT * FROM conversations WHERE projectId = ? ORDER BY updatedAt DESC');
  const rows = stmt.all(projectId) as any[];
  return rows.map(row => ({
    ...row,
    messages: JSON.parse(row.messages)
  }));
};

export const getConversationById = (id: string): Conversation | undefined => {
  const stmt = db.prepare('SELECT * FROM conversations WHERE id = ?');
  const row = stmt.get(id) as any;
  if (!row) return undefined;
  return {
    ...row,
    messages: JSON.parse(row.messages)
  };
};

export const createConversation = (conversation: Conversation): void => {
  const stmt = db.prepare('INSERT INTO conversations (id, title, messages, projectId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)');
  stmt.run(
    conversation.id,
    conversation.title,
    JSON.stringify(conversation.messages),
    conversation.projectId,
    conversation.createdAt,
    conversation.updatedAt
  );
};

export const updateConversation = (conversation: Conversation): void => {
  const stmt = db.prepare('UPDATE conversations SET title = ?, messages = ?, updatedAt = ? WHERE id = ?');
  stmt.run(
    conversation.title,
    JSON.stringify(conversation.messages),
    conversation.updatedAt,
    conversation.id
  );
};

export const deleteConversation = (id: string): void => {
  const stmt = db.prepare('DELETE FROM conversations WHERE id = ?');
  stmt.run(id);
};

export const deleteProjectConversations = (projectId: string): void => {
  const stmt = db.prepare('DELETE FROM conversations WHERE projectId = ?');
  stmt.run(projectId);
};

interface UserSettingsRow {
  id: number;
  model_provider: string;
  provider_settings: string;
  created_at: number;
  updated_at: number;
}

export const getUserSettings = (): UserSettings | null => {
  const stmt = db.prepare('SELECT * FROM user_settings WHERE id = 1');
  const row = stmt.get() as UserSettingsRow | undefined;
  
  if (!row) return null;

  return {
    model_provider: row.model_provider as UserSettings['model_provider'],
    provider_settings: JSON.parse(row.provider_settings),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
};

export const updateUserSettings = async (settings: Omit<UserSettings, 'created_at' | 'updated_at'>): Promise<void> => {
  const currentSettings = db.prepare('SELECT created_at FROM user_settings WHERE id = 1').get();
  
  if (currentSettings) {
    // Update existing settings
    const stmt = db.prepare(`
      UPDATE user_settings 
      SET model_provider = ?,
          provider_settings = ?,
          updated_at = ?
      WHERE id = 1
    `);
    stmt.run(
      settings.model_provider,
      JSON.stringify(settings.provider_settings),
      Date.now()
    );
  } else {
    // Insert new settings
    const stmt = db.prepare(`
      INSERT INTO user_settings (
        id,
        model_provider,
        provider_settings,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?)
    `);
    const now = Date.now();
    stmt.run(
      1,
      settings.model_provider,
      JSON.stringify(settings.provider_settings),
      now,
      now
    );
  }
};

export const setupDbHandlers = () => {
  // Settings handlers
  ipcMain.handle('settings:get', async () => {
    try {
      return getUserSettings();
    } catch (err) {
      console.error('Error getting user settings:', err);
      throw err;
    }
  });

  ipcMain.handle('settings:update', async (_, settings: Omit<UserSettings, 'created_at' | 'updated_at'>) => {
    try {
      await updateUserSettings(settings);
      return getUserSettings();
    } catch (err) {
      console.error('Error updating user settings:', err);
      throw err;
    }
  });

  // Project handlers
  ipcMain.handle('projects:getAll', async () => {
    try {
      return getAllProjects();
    } catch (err) {
      console.error('Error getting all projects:', err);
      throw err;
    }
  });

  ipcMain.handle('projects:create', async (_, project) => {
    try {
      createProject(project);
      return getAllProjects();
    } catch (err) {
      console.error('Error creating project:', err);
      throw err;
    }
  });

  ipcMain.handle('projects:update', async (_, project) => {
    try {
      updateProject(project);
      return getAllProjects();
    } catch (err) {
      console.error('Error updating project:', err);
      throw err;
    }
  });

  ipcMain.handle('projects:delete', async (_, id) => {
    try {
      deleteProjectConversations(id);  // First delete associated conversations
      deleteProject(id);
      return getAllProjects();
    } catch (err) {
      console.error('Error deleting project:', err);
      throw err;
    }
  });

  ipcMain.handle('conversations:getAll', async (_, projectId) => {
    try {
      return getAllConversations(projectId);
    } catch (err) {
      console.error('Error getting all conversations:', err);
      throw err;
    }
  });

  ipcMain.handle('conversations:create', async (_, conversation) => {
    try {
      createConversation(conversation);
      return getConversationById(conversation.id);
    } catch (err) {
      console.error('Error creating conversation:', err);
      throw err;
    }
  });

  ipcMain.handle('conversations:update', async (_, conversation) => {
    try {
      updateConversation(conversation);
      return getConversationById(conversation.id);
    } catch (err) {
      console.error('Error updating conversation:', err);
      throw err;
    }
  });

  ipcMain.handle('conversations:delete', async (_, { id }) => {
    try {
      deleteConversation(id);
      return;
    } catch (err) {
      console.error('Error deleting conversation:', err);
      throw err;
    }
  });
};
