// Independent fake API, using the alternative implementation permitted by the PDF.
// React components never read or write localStorage directly.
import { makeSeedTasks } from '../data/seed.js';
import { API_CONFIG, DATA_KEY } from './settings.js';

export const STATUSES = ['To do', 'In progress', 'Completed'];
export const PRIORITIES = ['Low', 'Medium', 'High'];
const failNext = new Set();
let writing = false;

export function failNextRequest(kind) {
  if (!['list', 'details', 'write'].includes(kind)) throw new Error('Unknown request kind.');
  failNext.add(kind);
}

function readData() {
  let raw;
  try {
    raw = localStorage.getItem(DATA_KEY);
  } catch {
    throw new Error('Browser storage is unavailable. Allow site data and try again.');
  }
  if (raw === null) {
    const seed = makeSeedTasks();
    writeData(seed);
    return seed;
  }
  try {
    const records = JSON.parse(raw);
    if (!Array.isArray(records) || records.some((item) =>
      !item || typeof item.id !== 'string' || typeof item.title !== 'string' ||
      typeof item.description !== 'string' || typeof item.course !== 'string' ||
      typeof item.instructor !== 'string' || typeof item.dueDate !== 'string' ||
      typeof item.notes !== 'string' || typeof item.createdAt !== 'string' ||
      typeof item.updatedAt !== 'string' || !STATUSES.includes(item.status) ||
      !PRIORITIES.includes(item.priority) || !Number.isFinite(item.estimatedHours))) {
      throw new Error('Invalid records');
    }
    return records;
  } catch {
    throw new Error('Saved data is invalid. Remove only the studyflow-assignments-v1 entry in browser storage, then reload.');
  }
}

function writeData(items) {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(items));
  } catch {
    throw new Error('Could not save your changes. Browser storage may be full or blocked.');
  }
}

function fakeRequest(operation, { signal, kind } = {}) {
  // Capture settings per request: changing the profile affects future requests.
  const { minDelay, maxDelay, errorChance } = API_CONFIG;
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Request cancelled', 'AbortError'));
      return;
    }
    const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
    const onAbort = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      reject(new DOMException('Request cancelled', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      if (failNext.delete(kind) || Math.random() < errorChance) {
        reject(new Error('Simulated network error. Your data has not changed. Please try again.'));
        return;
      }
      try { resolve(structuredClone(operation())); }
      catch (error) { reject(error); }
    }, delay);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function writeRequest(operation, options) {
  // Protect against duplicate/concurrent writes at the API boundary as well as in the UI.
  if (writing) return Promise.reject(new Error('Another change is being saved. Please wait.'));
  writing = true;
  return fakeRequest(operation, { ...options, kind: 'write' }).finally(() => { writing = false; });
}

function requireItem(items, id) {
  const item = items.find((entry) => entry.id === id);
  if (!item) throw new Error('This assignment no longer exists. Reload the list.');
  return item;
}

function validate(data) {
  const fields = {
    title: String(data.title ?? '').trim(),
    course: String(data.course ?? '').trim(),
    instructor: String(data.instructor ?? '').trim(),
    description: String(data.description ?? '').trim(),
    notes: String(data.notes ?? '').trim(),
    dueDate: data.dueDate,
    priority: data.priority,
    status: data.status,
    estimatedHours: Number(data.estimatedHours),
  };
  for (const [key, max] of Object.entries({ title: 100, course: 80, instructor: 80, description: 2000 })) {
    if (!fields[key] || fields[key].length > max) throw new Error(`${key} is required (maximum ${max} characters).`);
  }
  if (fields.notes.length > 2000) throw new Error('Notes must be no longer than 2000 characters.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.dueDate ?? '') ||
      Number.isNaN(Date.parse(fields.dueDate)) ||
      new Date(`${fields.dueDate}T00:00:00Z`).toISOString().slice(0, 10) !== fields.dueDate) {
    throw new Error('Choose a valid due date.');
  }
  if (!STATUSES.includes(fields.status) || !PRIORITIES.includes(fields.priority)) throw new Error('Choose a valid status and priority.');
  if (!Number.isFinite(fields.estimatedHours) || fields.estimatedHours < 0.5 || fields.estimatedHours > 100) throw new Error('Estimate must be between 0.5 and 100 hours.');
  return fields;
}

export function toSummary(item) {
  const { id, title, course, dueDate, priority, status, estimatedHours } = item;
  return { id, title, course, dueDate, priority, status, estimatedHours };
}

export function getItemsList(options = {}) {
  // Description, instructor, notes and timestamps are deliberately omitted.
  return fakeRequest(() => readData().map(toSummary), { ...options, kind: 'list' });
}

export function getItem(id, options = {}) {
  return fakeRequest(() => requireItem(readData(), id), { ...options, kind: 'details' });
}

export function createItem(data, options = {}) {
  return writeRequest(() => {
    const fields = validate(data);
    const items = readData();
    const now = new Date().toISOString();
    const item = { ...fields, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    writeData([item, ...items]);
    return item;
  }, options);
}

export function updateItem(id, changes, options = {}) {
  return writeRequest(() => {
    const items = readData();
    const previous = requireItem(items, id);
    const item = { ...previous, ...validate({ ...previous, ...changes }), updatedAt: new Date().toISOString() };
    writeData(items.map((entry) => entry.id === id ? item : entry));
    return item;
  }, options);
}

export function deleteItem(id, options = {}) {
  return writeRequest(() => {
    const items = readData();
    requireItem(items, id);
    writeData(items.filter((entry) => entry.id !== id));
    return { id };
  }, options);
}
