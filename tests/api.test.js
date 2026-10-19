import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createItem, deleteItem, failNextRequest, getItem, getItemsList, updateItem } from '../src/api/fakeApi.js';
import { API_CONFIG, DATA_KEY } from '../src/api/settings.js';

let storage;
beforeEach(() => {
  storage = new Map();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
  } });
  Object.assign(API_CONFIG, { minDelay: 5, maxDelay: 5, errorChance: 0 });
});

const draft = { title: 'Test assignment', course: 'React', instructor: 'Instructor',
  description: 'Understand safe asynchronous state updates.', notes: 'Demo notes',
  dueDate: '2026-11-15', priority: 'High', status: 'To do', estimatedHours: 2 };

test('list returns summaries; detail request supplies additional fields', async () => {
  const list = await getItemsList();
  assert.equal(list.length, 6);
  assert.equal('description' in list[0], false);
  assert.equal('instructor' in list[0], false);
  const item = await getItem(list[0].id);
  assert.equal(Object.keys(item).length, 12);
  assert.ok(item.description);
  assert.ok(item.instructor);
});

test('create, edit, complete and remove persist their results', async () => {
  const item = await createItem(draft);
  assert.equal((await getItem(item.id)).title, draft.title);
  await updateItem(item.id, { title: 'Updated title', status: 'Completed' });
  assert.equal((await getItem(item.id)).status, 'Completed');
  assert.equal(JSON.parse(storage.get(DATA_KEY)).find((record) => record.id === item.id).title, 'Updated title');
  await deleteItem(item.id);
  await assert.rejects(getItem(item.id), /no longer exists/);
});

test('failed writes do not modify persisted records and can be retried', async () => {
  const list = await getItemsList();
  const original = storage.get(DATA_KEY);
  failNextRequest('write');
  await assert.rejects(updateItem(list[0].id, { status: 'Completed' }), /network error/);
  assert.equal(storage.get(DATA_KEY), original);
  assert.equal((await updateItem(list[0].id, { status: 'Completed' })).status, 'Completed');
});

test('cancelling a delayed mutation prevents its storage write', async () => {
  const list = await getItemsList();
  const original = storage.get(DATA_KEY);
  API_CONFIG.minDelay = API_CONFIG.maxDelay = 80;
  const controller = new AbortController();
  const pending = updateItem(list[0].id, { status: 'Completed' }, { signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
  assert.equal(storage.get(DATA_KEY), original);
});

test('concurrent conflicting writes are rejected', async () => {
  const item = await createItem(draft);
  const update = updateItem(item.id, { status: 'Completed' });
  await assert.rejects(deleteItem(item.id), /Another change/);
  await update;
  assert.equal((await getItem(item.id)).status, 'Completed');
});

test('empty storage database stays empty instead of reseeding', async () => {
  storage.set(DATA_KEY, '[]');
  assert.deepEqual(await getItemsList(), []);
  assert.equal(storage.get(DATA_KEY), '[]');
});

test('invalid input and corrupt storage produce useful errors', async () => {
  await assert.rejects(createItem({ ...draft, title: '   ' }), /title is required/);
  await assert.rejects(createItem({ ...draft, dueDate: '2026-02-30' }), /valid due date/);
  await assert.rejects(createItem({ ...draft, estimatedHours: -1 }), /between 0.5 and 100/);
  storage.set(DATA_KEY, '{broken');
  await assert.rejects(getItemsList(), /Saved data is invalid/);
});

test('blocked storage is reported without falsely confirming a save', async () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: () => JSON.stringify([]),
    setItem: () => { throw new Error('QuotaExceededError'); },
  } });
  await assert.rejects(createItem(draft), /Could not save your changes/);
});
