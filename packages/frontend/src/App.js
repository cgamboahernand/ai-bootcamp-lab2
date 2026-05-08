import React, { useState, useEffect } from 'react';
import './App.css';

function TaskForm({ onAdd }) {
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), dueDate || null);
    setName('');
    setDueDate('');
  };

  return (
    <section className="add-task-section">
      <h2>Add New Task</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter task name"
          aria-label="Task name"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          aria-label="Due date"
        />
        <button type="submit">Add Task</button>
      </form>
    </section>
  );
}

function SortControls({ sortBy, onSort }) {
  return (
    <div className="sort-controls">
      <span>Sort by:</span>
      <button
        type="button"
        className={sortBy === 'name' ? 'sort-btn active' : 'sort-btn'}
        onClick={() => onSort('name')}
      >
        Name
      </button>
      <button
        type="button"
        className={sortBy === 'due_date' ? 'sort-btn active' : 'sort-btn'}
        onClick={() => onSort('due_date')}
      >
        Due Date
      </button>
    </div>
  );
}

function TaskItem({ task, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(task.name);
  const [editDueDate, setEditDueDate] = useState(task.due_date || '');

  const handleSave = (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    onUpdate(task.id, editName.trim(), editDueDate || null);
    setEditing(false);
  };

  const handleCancel = () => {
    setEditName(task.name);
    setEditDueDate(task.due_date || '');
    setEditing(false);
  };

  if (editing) {
    return (
      <li className="task-item editing">
        <form onSubmit={handleSave} className="edit-form">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            aria-label="Edit task name"
          />
          <input
            type="date"
            value={editDueDate}
            onChange={(e) => setEditDueDate(e.target.value)}
            aria-label="Edit due date"
          />
          <button type="submit" className="save-btn">Save</button>
          <button type="button" className="cancel-btn" onClick={handleCancel}>Cancel</button>
        </form>
      </li>
    );
  }

  return (
    <li className="task-item">
      <div className="task-info">
        <span className="task-name">{task.name}</span>
        {task.due_date && (
          <span className="task-due-date">Due: {task.due_date}</span>
        )}
      </div>
      <div className="task-actions">
        <button
          type="button"
          className="edit-btn"
          onClick={() => setEditing(true)}
        >
          Edit
        </button>
        <button
          type="button"
          className="delete-btn"
          onClick={() => onDelete(task.id)}
        >
          Delete
        </button>
      </div>
    </li>
  );
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('');

  useEffect(() => {
    fetchTasks(sortBy);
  }, [sortBy]);

  const fetchTasks = async (sort = '') => {
    try {
      setLoading(true);
      const url = sort ? `/api/tasks?sort=${sort}` : '/api/tasks';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const result = await response.json();
      setTasks(result);
      setError(null);
    } catch (err) {
      setError('Failed to fetch tasks: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (name, due_date) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, due_date }),
      });
      if (!response.ok) throw new Error('Failed to add task');
      const newTask = await response.json();
      setTasks((prev) => [newTask, ...prev]);
      setError(null);
    } catch (err) {
      setError('Error adding task: ' + err.message);
    }
  };

  const handleUpdate = async (id, name, due_date) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, due_date }),
      });
      if (!response.ok) throw new Error('Failed to update task');
      const updated = await response.json();
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setError(null);
    } catch (err) {
      setError('Error updating task: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete task');
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setError(null);
    } catch (err) {
      setError('Error deleting task: ' + err.message);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>To Do App</h1>
        <p>Keep track of your tasks</p>
      </header>

      <main>
        <TaskForm onAdd={handleAdd} />

        <section className="tasks-section">
          <div className="tasks-header">
            <h2>Tasks</h2>
            <SortControls sortBy={sortBy} onSort={setSortBy} />
          </div>
          {loading && <p>Loading tasks...</p>}
          {error && <p className="error">{error}</p>}
          {!loading && !error && (
            <ul>
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                  />
                ))
              ) : (
                <p>No tasks found. Add some!</p>
              )}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;