const { test, expect } = require('@playwright/test');
const { TodoPage } = require('./pages/TodoPage');

test.describe('Add task with due date', () => {
  let todoPage;

  test.beforeEach(async ({ page }) => {
    todoPage = new TodoPage(page);
    await todoPage.goto();
  });

  test('user can add a task and it appears in the list', async ({ page }) => {
    await todoPage.addTask('E2E Workflow Task');
    await todoPage.expectTaskVisible('E2E Workflow Task');
  });

  test('user can add a task with a due date and it shows in the list', async ({ page }) => {
    await todoPage.addTask('Task With Deadline', '2026-12-31');
    await todoPage.expectTaskVisible('Task With Deadline');
    await expect(page.getByText(/Due: 2026-12-31/)).toBeVisible();
  });
});
