import Database from 'better-sqlite3';
import { app, ipcMain } from 'electron';
import path from 'path';
import { Project } from '../types';

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

    // Insert default projects if table is empty
    const count = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
    if (count.count === 0) {
        // TODO: Make default projects meaningful
        const defaultProjects = [
            {
                id: "personal",
                name: "Personal",
                path: "/personal",
                description: "Your personal notes and thoughts",
            },
            {
                id: "work",
                name: "Work",
                path: "/work",
                description: "Your work notes and thoughts",
            },
            {
                id: "research",
                name: "Research",
                path: "/research",
                description: "Your research notes and thoughts",
            },
            {
                id: "archive",
                name: "Archive",
                path: "/archive",
                description: "Your archived notes and thoughts",
            },
            {
                id: "settings",
                name: "Settings",
                path: "/settings",
                description: "Your settings and preferences",
            }
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

export const setupProjectHandlers = () => {
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
      deleteProject(id);
      return getAllProjects();
    } catch (err) {
      console.error('Error deleting project:', err);
      throw err;
    }
  });
};
