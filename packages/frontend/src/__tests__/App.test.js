import React, { act } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

const sampleTasks = [
  { id: 1, name: 'Test Task 1', due_date: '2026-06-01', created_at: '2026-01-01T00:00:00.000Z' },
  { id: 2, name: 'Test Task 2', due_date: null, created_at: '2026-01-02T00:00:00.000Z' },
];

// Mock server to intercept API requests
const server = setupServer(
  rest.get('/api/tasks', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(sampleTasks));
  }),

  rest.post('/api/tasks', (req, res, ctx) => {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res(ctx.status(400), ctx.json({ error: 'Task name is required' }));
    }
    return res(
      ctx.status(201),
      ctx.json({ id: 3, name, due_date: req.body.due_date || null, created_at: new Date().toISOString() })
    );
  }),

  rest.put('/api/tasks/:id', (req, res, ctx) => {
    const { id } = req.params;
    const { name, due_date } = req.body;
    const task = sampleTasks.find(t => t.id === parseInt(id));
    if (!task) return res(ctx.status(404), ctx.json({ error: 'Task not found' }));
    return res(ctx.status(200), ctx.json({ ...task, name: name ?? task.name, due_date: due_date ?? task.due_date }));
  }),

  rest.delete('/api/tasks/:id', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ message: 'Task deleted successfully', id: parseInt(req.params.id) }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('App Component', () => {
  test('renders the header', async () => {
    await act(async () => { render(<App />); });
    expect(screen.getByText('To Do App')).toBeInTheDocument();
    expect(screen.getByText('Keep track of your tasks')).toBeInTheDocument();
  });

  test('loads and displays tasks', async () => {
    await act(async () => { render(<App />); });

    expect(screen.getByText('Loading tasks...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      expect(screen.getByText('Test Task 2')).toBeInTheDocument();
    });
  });

  test('displays due date for tasks that have one', async () => {
    await act(async () => { render(<App />); });

    await waitFor(() => {
      expect(screen.getByText(/Due: 2026-06-01/)).toBeInTheDocument();
    });
  });

  test('adds a new task', async () => {
    const user = userEvent.setup();
    await act(async () => { render(<App />); });

    await waitFor(() => expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument());

    const nameInput = screen.getByPlaceholderText('Enter task name');
    await act(async () => { await user.type(nameInput, 'New Test Task'); });

    const submitButton = screen.getByText('Add Task');
    await act(async () => { await user.click(submitButton); });

    await waitFor(() => {
      expect(screen.getByText('New Test Task')).toBeInTheDocument();
    });
  });

  test('renders sort controls', async () => {
    await act(async () => { render(<App />); });

    await waitFor(() => expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument());

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Due Date')).toBeInTheDocument();
  });

  test('sort by name fetches with sort param', async () => {
    let sortParam = null;
    server.use(
      rest.get('/api/tasks', (req, res, ctx) => {
        sortParam = req.url.searchParams.get('sort');
        return res(ctx.status(200), ctx.json(sampleTasks));
      })
    );

    const user = userEvent.setup();
    await act(async () => { render(<App />); });
    await waitFor(() => expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument());

    await act(async () => { await user.click(screen.getByText('Name')); });

    await waitFor(() => expect(sortParam).toBe('name'));
  });

  test('shows edit form when Edit is clicked', async () => {
    const user = userEvent.setup();
    await act(async () => { render(<App />); });

    await waitFor(() => {
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    await act(async () => { await user.click(editButtons[0]); });

    expect(screen.getByDisplayValue('Test Task 1')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  test('cancels edit and restores original task', async () => {
    const user = userEvent.setup();
    await act(async () => { render(<App />); });

    await waitFor(() => expect(screen.getByText('Test Task 1')).toBeInTheDocument());

    const editButtons = screen.getAllByText('Edit');
    await act(async () => { await user.click(editButtons[0]); });

    await act(async () => { await user.click(screen.getByText('Cancel')); });

    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });

  test('handles API error on fetch', async () => {
    server.use(
      rest.get('/api/tasks', (req, res, ctx) => res(ctx.status(500)))
    );

    await act(async () => { render(<App />); });

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch tasks/)).toBeInTheDocument();
    });
  });

  test('shows empty state when no tasks', async () => {
    server.use(
      rest.get('/api/tasks', (req, res, ctx) => res(ctx.status(200), ctx.json([])))
    );

    await act(async () => { render(<App />); });

    await waitFor(() => {
      expect(screen.getByText('No tasks found. Add some!')).toBeInTheDocument();
    });
  });
});