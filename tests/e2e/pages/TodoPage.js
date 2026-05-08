const { expect } = require('@playwright/test');

class TodoPage {
  constructor(page) {
    this.page = page;

    // Task form
    this.taskNameInput = page.getByPlaceholder('Enter task name');
    this.dueDateInput = page.getByLabel('Due date');
    this.addTaskButton = page.getByRole('button', { name: 'Add Task' });

    // Sort controls
    this.sortByNameButton = page.getByRole('button', { name: 'Name' });
    this.sortByDueDateButton = page.getByRole('button', { name: 'Due Date' });

    // Task list
    this.taskList = page.locator('ul');
    this.emptyState = page.getByText('No tasks found. Add some!');
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForSelector('ul', { timeout: 10000 });
  }

  async clearAllTasks() {
    const response = await this.page.request.get('/api/tasks');
    const tasks = await response.json();
    for (const task of tasks) {
      await this.page.request.delete(`/api/tasks/${task.id}`);
    }
    // Reload to reflect cleared state
    await this.page.reload();
    await this.page.waitForSelector('ul', { timeout: 10000 });
  }

  async addTask(name, dueDate = '') {
    await this.taskNameInput.fill(name);
    if (dueDate) {
      await this.dueDateInput.fill(dueDate);
    }
    // Set up listener BEFORE clicking to avoid race condition
    const responsePromise = this.page.waitForResponse(
      (res) => res.url().includes('/api/tasks') && res.request().method() === 'POST'
    );
    await this.addTaskButton.click();
    await responsePromise;
  }

  async getTaskNames() {
    const items = this.page.locator('.task-name');
    return items.allTextContents();
  }

  async clickEdit(taskName) {
    const taskItem = this.page.locator('.task-item').filter({ hasText: taskName }).first();
    await taskItem.getByRole('button', { name: 'Edit' }).click();
  }

  async saveEdit(newName, newDueDate = '') {
    const editNameInput = this.page.getByLabel('Edit task name');
    await editNameInput.clear();
    await editNameInput.fill(newName);
    if (newDueDate) {
      const editDueDateInput = this.page.getByLabel('Edit due date');
      await editDueDateInput.fill(newDueDate);
    }
    // Set up listener BEFORE clicking to avoid race condition
    const responsePromise = this.page.waitForResponse(
      (res) => res.url().includes('/api/tasks') && res.request().method() === 'PUT'
    );
    await this.page.getByRole('button', { name: 'Save' }).click();
    await responsePromise;
  }

  async cancelEdit() {
    await this.page.getByRole('button', { name: 'Cancel' }).click();
  }

  async deleteTask(taskName) {
    const taskItem = this.page.locator('.task-item').filter({ hasText: taskName });
    // Set up listener BEFORE clicking to avoid race condition
    const responsePromise = this.page.waitForResponse(
      (res) => res.url().includes('/api/tasks') && res.request().method() === 'DELETE'
    );
    await taskItem.first().getByRole('button', { name: 'Delete' }).click();
    await responsePromise;
  }

  async sortByName() {
    // Set up listener BEFORE clicking to avoid race condition
    const responsePromise = this.page.waitForResponse(
      (res) => res.url().includes('sort=name')
    );
    await this.sortByNameButton.click();
    await responsePromise;
  }

  async sortByDueDate() {
    // Set up listener BEFORE clicking to avoid race condition
    const responsePromise = this.page.waitForResponse(
      (res) => res.url().includes('sort=due_date')
    );
    await this.sortByDueDateButton.click();
    await responsePromise;
  }

  async expectTaskVisible(name) {
    // Use .first() to avoid strict mode violation when multiple tasks have the same name
    await expect(this.page.locator('.task-name', { hasText: name }).first()).toBeVisible();
  }

  async expectTaskNotVisible(name) {
    await expect(this.page.locator('.task-name', { hasText: name })).toHaveCount(0);
  }
}

module.exports = { TodoPage };
