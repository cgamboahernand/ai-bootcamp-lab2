const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const Database = require('better-sqlite3');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize in-memory SQLite database
const db = new Database(':memory:');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    due_date TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// Insert some initial data
const initialTasks = [
  { name: 'Task 1', due_date: null },
  { name: 'Task 2', due_date: '2026-05-15' },
  { name: 'Task 3', due_date: '2026-05-10' },
];
const insertStmt = db.prepare('INSERT INTO tasks (name, due_date) VALUES (?, ?)');

initialTasks.forEach(({ name, due_date }) => {
  insertStmt.run(name, due_date);
});

console.log('In-memory database initialized with sample data');

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend server is running' });
});

// API Routes

app.get('/api/tasks', (req, res) => {
  try {
    const { sort } = req.query;
    let orderBy = 'created_at DESC';
    if (sort === 'name') orderBy = 'name ASC';
    else if (sort === 'due_date') orderBy = 'due_date ASC';

    const tasks = db.prepare(`SELECT * FROM tasks ORDER BY ${orderBy}`).all();
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', (req, res) => {
  try {
    const { name, due_date } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Task name is required' });
    }

    if (due_date !== undefined && due_date !== null && due_date !== '') {
      if (isNaN(Date.parse(due_date))) {
        return res.status(400).json({ error: 'Invalid due date' });
      }
    }

    const result = insertStmt.run(name.trim(), due_date || null);
    const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/api/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Valid task ID is required' });
    }

    const { name, due_date } = req.body;

    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return res.status(400).json({ error: 'Task name cannot be empty' });
    }

    if (due_date !== undefined && due_date !== null && due_date !== '') {
      if (isNaN(Date.parse(due_date))) {
        return res.status(400).json({ error: 'Invalid due date' });
      }
    }

    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updatedName = name !== undefined ? name.trim() : existing.name;
    const updatedDueDate = due_date !== undefined ? (due_date || null) : existing.due_date;

    db.prepare('UPDATE tasks SET name = ?, due_date = ? WHERE id = ?').run(updatedName, updatedDueDate, id);
    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Valid task ID is required' });
    }

    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    if (result.changes > 0) {
      res.json({ message: 'Task deleted successfully', id: parseInt(id) });
    } else {
      res.status(404).json({ error: 'Task not found' });
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = { app, db, insertStmt };