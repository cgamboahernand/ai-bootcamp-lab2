const { test, expect } = require('@playwright/test');
const { TodoPage } = require('./pages/TodoPage');

test.describe('Delete task', () => {
  let todoPage;

  test.beforeEach(async ({ page }) => {
    todoPage = new TodoPage(page);
    await todoPage.goto();
    await todoPage.clearAllTasks();
    await todoPage.addTask('Task To Delete');
    await todoPage.expectTaskVisible('Task To Delete');
  });

  test('user can delete a task and it is removed from the list', async () => {
    await todoPage.deleteTask('Task To Delete');
    await todoPage.expectTaskNotVisible('Task To Delete');
  });
});
