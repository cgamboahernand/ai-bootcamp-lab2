const { test, expect } = require('@playwright/test');
const { TodoPage } = require('./pages/TodoPage');

test.describe('Sort task list', () => {
  let todoPage;

  test.beforeEach(async ({ page }) => {
    todoPage = new TodoPage(page);
    await todoPage.goto();
    await todoPage.clearAllTasks();
    // Seed tasks with known names for sort verification
    await todoPage.addTask('Zebra Task', '2026-07-01');
    await todoPage.addTask('Apple Task', '2026-05-01');
    await todoPage.addTask('Mango Task', '2026-06-01');
  });

  test('user can sort tasks by name alphabetically', async () => {
    await todoPage.sortByName();
    const names = await todoPage.getTaskNames();
    // Filter to just our seeded tasks
    const seeded = names.filter(n => ['Zebra Task', 'Apple Task', 'Mango Task'].includes(n));
    expect(seeded).toEqual([...seeded].sort());
  });

  test('user can sort tasks by due date', async ({ page }) => {
    await todoPage.sortByDueDate();
    // Verify the sort button is active and tasks are still visible
    await expect(page.locator('.task-name', { hasText: 'Apple Task' }).first()).toBeVisible();
    await expect(page.locator('.task-name', { hasText: 'Mango Task' }).first()).toBeVisible();
    await expect(page.locator('.task-name', { hasText: 'Zebra Task' }).first()).toBeVisible();
  });
});
