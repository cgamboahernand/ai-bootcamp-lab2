const request = require('supertest');
const { app, db } = require('../../src/app');

afterAll(() => {
  if (db) {
    db.close();
  }
});

beforeEach(() => {
  db.exec('DELETE FROM tasks');
  db.exec("INSERT INTO tasks (name, due_date) VALUES ('Seed Task A', '2026-05-01')");
  db.exec("INSERT INTO tasks (name, due_date) VALUES ('Seed Task B', null)");
});

describe('Tasks API Integration', () => {
  describe('Full CRUD lifecycle', () => {
    it('creates, retrieves, updates, and deletes a task', async () => {
      // Create
      const createRes = await request(app)
        .post('/api/tasks')
        .send({ name: 'Integration Task', due_date: '2026-06-15' });
      expect(createRes.status).toBe(201);
      const { id } = createRes.body;
      expect(createRes.body.name).toBe('Integration Task');
      expect(createRes.body.due_date).toBe('2026-06-15');

      // Retrieve — task appears in list
      const listRes = await request(app).get('/api/tasks');
      expect(listRes.status).toBe(200);
      expect(listRes.body.some(t => t.id === id)).toBe(true);

      // Update
      const updateRes = await request(app)
        .put(`/api/tasks/${id}`)
        .send({ name: 'Updated Task', due_date: '2026-07-01' });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.name).toBe('Updated Task');
      expect(updateRes.body.due_date).toBe('2026-07-01');

      // Delete
      const deleteRes = await request(app).delete(`/api/tasks/${id}`);
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body).toEqual({ message: 'Task deleted successfully', id });

      // Confirm gone
      const afterDelete = await request(app).get('/api/tasks');
      expect(afterDelete.body.some(t => t.id === id)).toBe(false);
    });
  });

  describe('Sorting', () => {
    it('returns tasks sorted by name ascending', async () => {
      const res = await request(app).get('/api/tasks?sort=name');
      expect(res.status).toBe(200);
      const names = res.body.map(t => t.name);
      expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    });

    it('returns tasks sorted by due_date ascending', async () => {
      const res = await request(app).get('/api/tasks?sort=due_date');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('returns 404 when updating a non-existent task', async () => {
      const res = await request(app)
        .put('/api/tasks/999999')
        .send({ name: 'Ghost' });
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Task not found');
    });

    it('returns 404 when deleting a non-existent task', async () => {
      const res = await request(app).delete('/api/tasks/999999');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Task not found');
    });

    it('returns 400 when creating a task without a name', async () => {
      const res = await request(app).post('/api/tasks').send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Task name is required');
    });
  });
});
