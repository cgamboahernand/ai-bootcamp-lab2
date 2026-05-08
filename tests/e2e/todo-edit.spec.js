const { test, expect } = require('@playwright/test');
const { TodoPage } = require('./pages/TodoPage');

test.describe('Edit task', () => {
  let todoPage;

  test.beforeEach(async ({ page }) => {
    todoPage = new TodoPage(page);
    await todoPage.goto();
    await todoPage.clearAllTasks();
    await todoPage.addTask('Original Task Name', '2026-06-01');
    await todoPage.expectTaskVisible('Original Task Name');
  });

  test('user can edit a task name', async () => {
    await todoPage.clickEdit('Original Task Name');
    await todoPage.saveEdit('Renamed Task');
    await todoPage.expectTaskVisible('Renamed Task');
    await todoPage.expectTaskNotVisible('Original Task Name');
  });

  test('user can edit a task due date', async ({ page }) => {
    await todoPage.clickEdit('Original Task Name');
    await todoPage.saveEdit('Original Task Name', '2026-09-15');
    await expect(page.getByText(/Due: 2026-09-15/)).toBeVisible();
  });

  test('user can cancel edit and task remains unchanged', async () => {
    await todoPage.clickEdit('Original Task Name');
    await todoPage.cancelEdit();
    await todoPage.expectTaskVisible('Original Task Name');
    await expect(todoPage.page.getByRole('button', { name: 'Save' })).not.toBeVisible();
  });
});
