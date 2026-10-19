import { test, expect } from '@playwright/test';

async function boot(page) {
  await page.addInitScript(() => { Math.random = () => 0.5; });
  await page.goto('/');
  await expect(page.getByTestId('task-task-react')).toBeVisible();
  await expect(page.getByTestId('task-details')).toHaveAttribute('data-item-id', 'task-react');
  await page.getByText('API playground', { exact: false }).click();
  await page.getByLabel('Network profile').selectOption('reliable');
}

async function setDelay(page, ms) {
  await page.evaluate(async (delay) => {
    const { API_CONFIG } = await import('/src/api/settings.js');
    Object.assign(API_CONFIG, { minDelay: delay, maxDelay: delay, errorChance: 0 });
  }, ms);
}

test('create, edit, complete, reload and remove; failed save preserves the form', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await boot(page);
  await page.getByRole('button', { name: 'New assignment', exact: true }).click();
  await page.getByLabel('Assignment title').fill('A real CRUD test');
  await page.getByLabel('Course', { exact: true }).fill('React testing');
  await page.getByLabel('Instructor', { exact: true }).fill('Test instructor');
  await page.getByLabel('Description', { exact: true }).fill('Create, edit and remove one complete record.');
  await page.getByLabel('Due date', { exact: true }).fill('2026-11-15');
  await page.getByRole('button', { name: 'Create assignment', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByTestId('task-details').getByRole('heading', { name: 'A real CRUD test' })).toBeVisible();
  await page.getByRole('button', { name: 'Fail next save', exact: true }).click();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Assignment title').fill('Edited assignment');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Simulated network error');
  await expect(page.getByLabel('Assignment title')).toHaveValue('Edited assignment');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByTestId('task-details').getByRole('heading', { name: 'Edited assignment' })).toBeVisible();
  await page.getByRole('button', { name: 'Mark as completed', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Reopen assignment', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('task-details').getByRole('heading', { name: 'Edited assignment' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reopen assignment', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Remove', exact: true }).click();
  await page.getByRole('button', { name: 'Yes, remove', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('.task-title').filter({ hasText: 'Edited assignment' })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('late A response never replaces B, even if transport ignores cancellation', async ({ page }) => {
  await boot(page);
  // Emulate a transport that ignores AbortController. The Effect's active flag must still protect UI.
  await page.evaluate(() => { AbortController.prototype.abort = function () {}; });
  await setDelay(page, 1500);
  await page.getByTestId('task-task-design').click();
  await expect(page.getByText('Loading assignment details…')).toBeVisible();
  await setDelay(page, 40);
  await page.getByTestId('task-task-data').click();
  await expect(page.getByTestId('task-details')).toHaveAttribute('data-item-id', 'task-data');
  await page.waitForTimeout(1700); // Wait beyond the slow response to catch a late overwrite.
  await expect(page.getByTestId('task-details')).toHaveAttribute('data-item-id', 'task-data');
  await expect(page.getByTestId('task-details')).not.toContainText('Map the customer journey');
});

test('completion captures A while selection moves to B and conflicting writes stay blocked', async ({ page }) => {
  await boot(page);
  await setDelay(page, 1400);
  await page.getByRole('button', { name: 'Mark as completed', exact: true }).click();
  await expect(page.getByRole('button', { name: 'New assignment', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Reload', exact: true })).toBeDisabled();
  await setDelay(page, 50);
  await page.getByTestId('task-task-design').click();
  await expect(page.getByTestId('task-details')).toHaveAttribute('data-item-id', 'task-design');
  await expect(page.getByRole('button', { name: 'Edit', exact: true })).toBeDisabled();
  await expect(page.getByTestId('task-task-react')).toContainText('Completed');
  await expect(page.getByRole('button', { name: 'Edit', exact: true })).toBeEnabled();
  await expect(page.getByTestId('task-details')).toHaveAttribute('data-item-id', 'task-design');
  await expect(page.getByTestId('task-details')).toContainText('To do');
  const states = await page.evaluate(() => JSON.parse(localStorage.getItem('studyflow-assignments-v1')));
  expect(states.find((task) => task.id === 'task-react').status).toBe('Completed');
  expect(states.find((task) => task.id === 'task-design').status).toBe('To do');
});

test('list/detail failures recover and empty search is clear', async ({ page }) => {
  await boot(page);
  await page.getByRole('button', { name: 'Fail next list', exact: true }).click();
  await page.getByRole('button', { name: 'Reload', exact: true }).click();
  await expect(page.getByRole('heading', { name: "Couldn't load assignments" })).toBeVisible();
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByTestId('task-details')).toBeVisible();
  await page.getByRole('button', { name: 'Fail next details', exact: true }).click();
  await page.getByTestId('task-task-design').click();
  await expect(page.getByRole('heading', { name: "Couldn't load details" })).toBeVisible();
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByTestId('task-details')).toHaveAttribute('data-item-id', 'task-design');
  await page.getByRole('textbox', { name: 'Search assignments' }).fill('no-such-course-999');
  await expect(page.getByRole('heading', { name: 'No matching assignments' })).toBeVisible();
});

test('empty database survives Reload and shows create action', async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0.5;
    localStorage.setItem('studyflow-assignments-v1', '[]');
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'A fresh start' })).toBeVisible();
  await page.getByRole('button', { name: 'Reload', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A fresh start' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add assignment', exact: true })).toBeEnabled();
});

test('mobile layout fits the viewport and permits creating a task', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await boot(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'New assignment', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await page.getByRole('dialog').evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth)).toBe(true);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
});
