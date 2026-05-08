const { test, expect } = require('@playwright/test');
const { TodoPage } = require('./pages/TodoPage');

test.describe('Task validation', () => {
  let todoPage;

  test.beforeEach(async ({ page }) => {
    todoPage = new TodoPage(page);
    await todoPage.goto();
  });

  test('submitting an empty task name does not add a task', async ({ page }) => {
    const taskCountBefore = await page.locator('.task-item').count();

    // Click add without filling in a name (button requires name to submit)
    await todoPage.addTaskButton.click();

    // Task count should remain the same
    const taskCountAfter = await page.locator('.task-item').count();
    expect(taskCountAfter).toBe(taskCountBefore);
  });
});
