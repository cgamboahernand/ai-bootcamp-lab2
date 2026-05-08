const request = require('supertest');
const { app, db } = require('../src/app');

// Close the database connection after all tests
afterAll(() => {
  if (db) {
    db.close();
  }
});

// Test helpers
const createTask = async (name = 'Temp Task', due_date = null) => {
  const response = await request(app)
    .post('/api/tasks')
    .send({ name, due_date })
    .set('Accept', 'application/json');

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('id');
  return response.body;
};

describe('API Endpoints', () => {
  describe('GET /api/tasks', () => {
    it('should return all tasks', async () => {
      const response = await request(app).get('/api/tasks');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const task = response.body[0];
      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('name');
      expect(task).toHaveProperty('due_date');
      expect(task).toHaveProperty('created_at');
    });

    it('should sort tasks by name', async () => {
      const response = await request(app).get('/api/tasks?sort=name');

      expect(response.status).toBe(200);
      const names = response.body.map(t => t.name);
      expect(names).toEqual([...names].sort());
    });

    it('should sort tasks by due_date', async () => {
      const response = await request(app).get('/api/tasks?sort=due_date');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task without due date', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ name: 'Test Task' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Task');
      expect(response.body).toHaveProperty('due_date');
      expect(response.body).toHaveProperty('created_at');
    });

    it('should create a new task with a due date', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ name: 'Task With Due Date', due_date: '2026-06-01' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Task With Due Date');
      expect(response.body.due_date).toBe('2026-06-01');
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({})
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Task name is required');
    });

    it('should return 400 if name is empty', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ name: '' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Task name is required');
    });

    it('should return 400 for invalid due date', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ name: 'Task', due_date: 'not-a-date' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid due date');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update a task name', async () => {
      const task = await createTask('Original Name');

      const response = await request(app)
        .put(`/api/tasks/${task.id}`)
        .send({ name: 'Updated Name' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
      expect(response.body.id).toBe(task.id);
    });

    it('should update a task due date', async () => {
      const task = await createTask('Task To Update');

      const response = await request(app)
        .put(`/api/tasks/${task.id}`)
        .send({ due_date: '2026-07-04' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.due_date).toBe('2026-07-04');
    });

    it('should update both name and due date', async () => {
      const task = await createTask('Old Name');

      const response = await request(app)
        .put(`/api/tasks/${task.id}`)
        .send({ name: 'New Name', due_date: '2026-08-01' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('New Name');
      expect(response.body.due_date).toBe('2026-08-01');
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .put('/api/tasks/999999')
        .send({ name: 'Ghost' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Task not found');
    });

    it('should return 400 for empty name', async () => {
      const task = await createTask('Valid Task');

      const response = await request(app)
        .put(`/api/tasks/${task.id}`)
        .send({ name: '' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Task name cannot be empty');
    });

    it('should return 400 for invalid id', async () => {
      const response = await request(app)
        .put('/api/tasks/abc')
        .send({ name: 'Test' })
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Valid task ID is required');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete an existing task', async () => {
      const task = await createTask('Task To Be Deleted');

      const deleteResponse = await request(app).delete(`/api/tasks/${task.id}`);
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body).toEqual({ message: 'Task deleted successfully', id: task.id });

      const deleteAgain = await request(app).delete(`/api/tasks/${task.id}`);
      expect(deleteAgain.status).toBe(404);
      expect(deleteAgain.body).toHaveProperty('error', 'Task not found');
    });

    it('should return 404 when task does not exist', async () => {
      const response = await request(app).delete('/api/tasks/999999');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Task not found');
    });

    it('should return 400 for invalid id', async () => {
      const response = await request(app).delete('/api/tasks/abc');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Valid task ID is required');
    });
  });
});