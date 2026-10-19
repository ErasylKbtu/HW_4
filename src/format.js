export function formatDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTimestamp(value) {
  return new Date(value).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function isOverdue(task) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return task.status !== 'Completed' && new Date(`${task.dueDate}T00:00:00`) < today;
}
