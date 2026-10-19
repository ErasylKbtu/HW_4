import { formatDate, isOverdue } from '../format.js';
import Icon from './Icon.jsx';
import { Badge, ErrorView, Loading } from './StateViews.jsx';

export default function TaskList({ list, tasks, selectedId, onSelect, onRetry, onCreate, filtered }) {
  if (list.status === 'loading') return <Loading />;
  if (list.status === 'error') return <ErrorView title="Couldn't load assignments" message={list.error} onRetry={onRetry} />;
  if (!tasks.length) return <div className="state-view"><span className="state-icon"><Icon name={filtered ? 'search' : 'book'} size={28} /></span><h3>{filtered ? 'No matching assignments' : 'A fresh start'}</h3><p>{filtered ? 'Try another search or choose a different status.' : 'Add your first assignment and make room for focused work.'}</p>{!filtered && <button className="button primary" onClick={onCreate}><Icon name="plus" size={17} />Add assignment</button>}</div>;

  return <ul className="task-list" aria-label="Assignments">
    {tasks.map((task) => <li key={task.id}>
      <button className={`task-card ${selectedId === task.id ? 'selected' : ''}`} onClick={() => onSelect(task.id)} aria-pressed={selectedId === task.id} data-testid={`task-${task.id}`}>
        <span className={`task-symbol ${task.status === 'Completed' ? 'done' : ''}`}><Icon name={task.status === 'Completed' ? 'check' : 'book'} size={21} /></span>
        <span className="task-main"><span className="task-course">{task.course}</span><span className="task-title">{task.title}</span><span className={`task-meta ${isOverdue(task) ? 'overdue' : ''}`}><Icon name="calendar" size={13} />{formatDate(task.dueDate)}<span className="meta-dot">·</span>{task.estimatedHours} h{isOverdue(task) ? ' · Overdue' : ''}</span></span>
        <span className="task-tags"><Badge>{task.status}</Badge><span className={`priority priority-${task.priority.toLowerCase()}`}><span />{task.priority}</span></span>
      </button>
    </li>)}
  </ul>;
}
