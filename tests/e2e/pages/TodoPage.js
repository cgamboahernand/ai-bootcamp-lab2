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

  async addTask(name, dueDate = '') {
    await this.taskNameInput.fill(name);
    if (dueDate) {
      await this.dueDateInput.fill(dueDate);
    }
    await this.addTaskButton.click();
    await this.page.waitForResponse((res) => res.url().includes('/api/tasks') && res.request().method() === 'POST');
  }

  async getTaskNames() {
    const items = this.page.locator('.task-name');
    return items.allTextContents();
  }

  async clickEdit(taskName) {
    const taskItem = this.page.locator('.task-item').filter({ hasText: taskName });
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
    await this.page.getByRole('button', { name: 'Save' }).click();
    await this.page.waitForResponse((res) => res.url().includes('/api/tasks') && res.request().method() === 'PUT');
  }

  async cancelEdit() {
    await this.page.getByRole('button', { name: 'Cancel' }).click();
  }

  async deleteTask(taskName) {
    const taskItem = this.page.locator('.task-item').filter({ hasText: taskName });
    await taskItem.getByRole('button', { name: 'Delete' }).click();
    await this.page.waitForResponse((res) => res.url().includes('/api/tasks') && res.request().method() === 'DELETE');
  }

  async sortByName() {
    await this.sortByNameButton.click();
    await this.page.waitForResponse((res) => res.url().includes('sort=name'));
  }

  async sortByDueDate() {
    await this.sortByDueDateButton.click();
    await this.page.waitForResponse((res) => res.url().includes('sort=due_date'));
  }

  async expectTaskVisible(name) {
    await expect(this.page.locator('.task-name', { hasText: name })).toBeVisible();
  }

  async expectTaskNotVisible(name) {
    await expect(this.page.locator('.task-name', { hasText: name })).not.toBeVisible();
  }
}

module.exports = { TodoPage };
