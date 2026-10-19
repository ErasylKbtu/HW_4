import { useEffect, useState } from 'react';
import { getItem } from '../api/fakeApi.js';
import { formatDate, formatTimestamp } from '../format.js';
import Icon from './Icon.jsx';
import { Badge, ErrorView, Loading } from './StateViews.jsx';

export default function TaskDetails({ id, revision, locked, onEdit, onRemove, onComplete }) {
  const [result, setResult] = useState({ status: 'loading', data: null, error: '', revision: -1 });
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setResult({ status: 'loading', data: null, error: '', revision });
    getItem(id, { signal: controller.signal })
      .then((data) => {
        if (active) setResult({ status: 'success', data, error: '', revision });
      })
      .catch((error) => {
        if (active && error.name !== 'AbortError') setResult({ status: 'error', data: null, error: error.message, revision });
      });
    return () => {
      active = false; // Also protects against APIs that cannot actually cancel a response.
      controller.abort();
    };
  }, [id, revision, retry]);

  if (result.status === 'loading' || result.revision !== revision) return <Loading text="Loading assignment details…" />;
  if (result.status === 'error') return <ErrorView title="Couldn't load details" message={result.error} onRetry={() => setRetry((value) => value + 1)} />;
  const task = result.data;

  return <article className="details-content" data-testid="task-details" data-item-id={task.id}>
    <div className="details-top"><span className="eyebrow">ASSIGNMENT DETAILS</span><Badge>{task.status}</Badge></div>
    <div className="detail-emblem"><Icon name="book" size={32} /></div>
    <p className="detail-course">{task.course}</p>
    <h2>{task.title}</h2>
    <p className="description">{task.description}</p>
    <dl className="detail-grid">
      <div><dt>Due date</dt><dd>{formatDate(task.dueDate)}</dd></div>
      <div><dt>Priority</dt><dd><span className={`priority priority-${task.priority.toLowerCase()}`}><span />{task.priority}</span></dd></div>
      <div><dt>Estimated time</dt><dd>{task.estimatedHours} hours</dd></div>
      <div><dt>Instructor</dt><dd>{task.instructor}</dd></div>
    </dl>
    <section className="notes"><h3>Notes & next steps</h3><p>{task.notes || 'No additional notes yet.'}</p></section>
    <dl className="timestamps"><div><dt>Created</dt><dd>{formatTimestamp(task.createdAt)}</dd></div><div><dt>Last updated</dt><dd>{formatTimestamp(task.updatedAt)}</dd></div></dl>
    <div className="detail-actions">
      <button className="button primary complete-button" disabled={locked} onClick={() => onComplete(task)}><Icon name={task.status === 'Completed' ? 'reload' : 'check'} size={18} />{task.status === 'Completed' ? 'Reopen assignment' : 'Mark as completed'}</button>
      <div className="action-row"><button className="button secondary" disabled={locked} onClick={() => onEdit(task)}><Icon name="edit" size={16} />Edit</button><button className="button danger-quiet" disabled={locked} onClick={() => onRemove(task)}><Icon name="trash" size={16} />Remove</button></div>
    </div>
  </article>;
}
