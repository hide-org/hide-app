import Database from 'better-sqlite3';
import { app, ipcMain } from 'electron';
import path from 'path';
import { homedir } from 'os';
import { v4 as uuidv4 } from 'uuid';
import { Conversation, Project, Task } from '../types';
import { UserSettings } from '../types/settings';

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
            status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive')),
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

  // Create tasks table if it doesn't exist
  db.exec(`
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
};

export const getAllProjects = (): Project[] => {
  const stmt = db.prepare('SELECT * FROM projects');
  return stmt.all() as Project[];
};

export const getProjectById = (id: string): Project | undefined => {
  const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
  return stmt.get(id) as Project | undefined;
};

export const getProjectByName = (name: string): Project | undefined => {
  const stmt = db.prepare('SELECT * FROM projects WHERE name = ?');
  return stmt.get(name) as Project | undefined;
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
  const stmt = db.prepare('INSERT INTO conversations (id, title, messages, projectId, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)');
  stmt.run(
    conversation.id,
    conversation.title,
    JSON.stringify(conversation.messages),
    conversation.projectId,
    conversation.status,
    conversation.createdAt,
    conversation.updatedAt
  );
};

export const updateConversation = (conversation: Conversation): void => {
  const stmt = db.prepare('UPDATE conversations SET title = ?, messages = ?, status = ?, updatedAt = ? WHERE id = ?');
  stmt.run(
    conversation.title,
    JSON.stringify(conversation.messages),
    conversation.status,
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

// Task CRUD operations
export const getAllTasks = (projectId: string): Task[] => {
  const stmt = db.prepare('SELECT * FROM tasks WHERE projectId = ? ORDER BY updatedAt DESC');
  const rows = stmt.all(projectId) as any[];
  return rows.map(row => ({
    ...row,
    metadata: JSON.parse(row.metadata)
  }));
};

export const getTaskById = (id: string): Task | undefined => {
  const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
  const row = stmt.get(id) as any;
  if (!row) return undefined;
  return {
    ...row,
    metadata: JSON.parse(row.metadata)
  };
};

export const createTask = (task: Task): void => {
  const stmt = db.prepare(`
    INSERT INTO tasks (
      id, title, description, status, metadata, 
      projectId, conversationId, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    task.id,
    task.title,
    task.description,
    task.status,
    JSON.stringify(task.metadata),
    task.projectId,
    task.conversationId,
    task.createdAt,
    task.updatedAt
  );
};

export const updateTask = (task: Task): void => {
  const stmt = db.prepare(`
    UPDATE tasks 
    SET title = ?, description = ?, status = ?, 
        metadata = ?, conversationId = ?, updatedAt = ? 
    WHERE id = ?
  `);
  stmt.run(
    task.title,
    task.description,
    task.status,
    JSON.stringify(task.metadata),
    task.conversationId,
    task.updatedAt,
    task.id
  );
};

export const deleteTask = (id: string): void => {
  const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
  stmt.run(id);
};

export const deleteProjectTasks = (projectId: string): void => {
  const stmt = db.prepare('DELETE FROM tasks WHERE projectId = ?');
  stmt.run(projectId);
};

export const deleteConversationTasks = (conversationId: string): void => {
  const stmt = db.prepare('DELETE FROM tasks WHERE conversationId = ?');
  stmt.run(conversationId);
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
      deleteProjectTasks(id);
      deleteProjectConversations(id);
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
      deleteConversationTasks(id);
      deleteConversation(id);
      return;
    } catch (err) {
      console.error('Error deleting conversation:', err);
      throw err;
    }
  });

  // Task handlers
  ipcMain.handle('tasks:getAll', async (_, projectId) => {
    try {
      return getAllTasks(projectId);
    } catch (err) {
      console.error('Error getting all tasks:', err);
      throw err;
    }
  });

  ipcMain.handle('tasks:getById', async (_, id) => {
    try {
      return getTaskById(id);
    } catch (err) {
      console.error('Error getting task by id:', err);
      throw err;
    }
  });

  ipcMain.handle('tasks:create', async (_, task) => {
    try {
      createTask(task);
      return getTaskById(task.id);
    } catch (err) {
      console.error('Error creating task:', err);
      throw err;
    }
  });

  ipcMain.handle('tasks:update', async (_, task) => {
    try {
      updateTask(task);
      return getTaskById(task.id);
    } catch (err) {
      console.error('Error updating task:', err);
      throw err;
    }
  });

  ipcMain.handle('tasks:delete', async (_, id) => {
    try {
      deleteTask(id);
      return;
    } catch (err) {
      console.error('Error deleting task:', err);
      throw err;
    }
  });
};
