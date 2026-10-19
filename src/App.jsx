import { useEffect, useState } from 'react';
import { createItem, deleteItem, getItemsList, toSummary, updateItem } from './api/fakeApi.js';
import Icon from './components/Icon.jsx';
import TaskList from './components/TaskList.jsx';
import TaskDetails from './components/TaskDetails.jsx';
import TaskForm, { Modal } from './components/TaskForm.jsx';
import NetworkPanel from './components/NetworkPanel.jsx';
import { isOverdue } from './format.js';

export default function App() {
  const [list, setList] = useState({ data: [], status: 'loading', error: '' });
  const [reload, setReload] = useState(0);
  const [revision, setRevision] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [mutation, setMutation] = useState(null);
  const [mutationError, setMutationError] = useState('');
  const [notice, setNotice] = useState(null);

  // Loading belongs in an Effect. The Reload button only changes its dependency.
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setList({ data: [], status: 'loading', error: '' });
    getItemsList({ signal: controller.signal })
      .then((data) => {
        if (!active) return;
        setList({ data, status: 'success', error: '' });
        setSelectedId((current) => data.some((item) => item.id === current) ? current : data[0]?.id ?? null);
        // Reload must invalidate details too, including changes made in another tab.
        setRevision((value) => value + 1);
      })
      .catch((error) => {
        if (active && error.name !== 'AbortError') setList({ data: [], status: 'error', error: error.message });
      });
    return () => { active = false; controller.abort(); };
  }, [reload]);

  // The command is an immutable snapshot of the user's click, including its item ID.
  // Selection is intentionally NOT a dependency: switching cards must not restart a write.
  useEffect(() => {
    if (!mutation) return;
    let active = true;
    const controller = new AbortController();
    const { type, id, values, title } = mutation;
    const options = { signal: controller.signal };
    const request = type === 'create' ? createItem(values, options)
      : type === 'remove' ? deleteItem(id, options)
      : updateItem(id, values, options);

    request.then((result) => {
      if (!active) return;
      setList((current) => ({ ...current, data: type === 'remove'
        ? current.data.filter((item) => item.id !== id)
        : type === 'create' ? [toSummary(result), ...current.data]
        : current.data.map((item) => item.id === id ? toSummary(result) : item),
      }));
      if (type === 'create') {
        setSelectedId(result.id);
        setFilter('All');
        setSearch('');
      }
      if (type === 'remove') setSelectedId((current) => current === id ? null : current);
      // For edit/complete, preserve whichever card the user is currently viewing.
      setRevision((value) => value + 1);
      setEditor(null);
      setRemoving(null);
      setMutationError('');
      const message = type === 'remove' ? `Removed “${title}”.`
        : type === 'create' ? `Created “${result.title}”.`
        : type === 'complete' ? `${result.status === 'Completed' ? 'Completed' : 'Reopened'} “${result.title}”.`
        : `Saved “${result.title}”.`;
      setNotice({ message, type: 'success' });
    }).catch((error) => {
      if (!active || error.name === 'AbortError') return;
      setMutationError(error.message);
      setNotice({ message: `Could not ${type === 'complete' ? 'update' : type} “${title}”: ${error.message}`, type: 'error' });
    }).finally(() => {
      if (active) setMutation(null);
    });
    return () => { active = false; controller.abort(); };
  }, [mutation]);

  const busy = mutation !== null;
  const locked = busy || list.status !== 'success';
  const completed = list.data.filter((item) => item.status === 'Completed').length;
  const inProgress = list.data.filter((item) => item.status === 'In progress').length;
  const open = list.data.length - completed;
  const overdue = list.data.filter(isOverdue).length;
  const hours = list.data.filter((item) => item.status !== 'Completed').reduce((sum, item) => sum + item.estimatedHours, 0);
  const progress = list.data.length ? Math.round(completed / list.data.length * 100) : 0;
  const tasks = list.data.filter((item) =>
    (filter === 'All' || item.status === filter) &&
    `${item.title} ${item.course}`.toLowerCase().includes(search.trim().toLowerCase()));

  function reloadList() {
    if (busy) return;
    setList((current) => ({ ...current, status: 'loading', error: '' }));
    setReload((value) => value + 1);
    setNotice(null);
  }
  function startMutation(command) {
    if (locked) return;
    setMutationError('');
    setNotice(null);
    setMutation(command);
  }
  function openEditor(item = null) {
    if (locked) return;
    setMutationError('');
    setEditor({ item });
  }
  function openRemove(item) {
    if (locked) return;
    setMutationError('');
    setRemoving(item);
  }
  function complete(task) {
    // Capture the target now; never read a later selection after awaiting the API.
    const targetId = task.id;
    startMutation({ type: 'complete', id: targetId, title: task.title,
      values: { status: task.status === 'Completed' ? 'To do' : 'Completed' } });
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#main"><span className="brand-mark"><Icon name="book" size={24} /></span>studyflow<span className="brand-dot">.</span></a>
      <p className="sidebar-label">YOUR WORKSPACE</p>
      <nav aria-label="Assignment views">
        {[['All', 'grid', 'Overview'], ['In progress', 'clock', 'In progress'], ['Completed', 'check', 'Completed']].map(([value, icon, label]) => <button key={value} className={`nav-link ${filter === value ? 'active' : ''}`} onClick={() => setFilter(value)} aria-pressed={filter === value}><Icon name={icon} size={19} />{label}<span>{value === 'All' ? list.data.length : value === 'Completed' ? completed : inProgress}</span></button>)}
      </nav>
      <div className="sidebar-note"><span className="note-spark">✳</span><h3>One task at a time.</h3><p>A clear plan makes space for your best work.</p><div className="mini-progress" role="progressbar" aria-label="Assignments completed" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress}%` }} /></div><span className="progress-caption">{progress}% of assignments completed</span></div>
      <div className="profile"><div className="avatar">KY</div><div><strong>Karas Yerassyl</strong><span>Information Systems</span></div></div>
    </aside>

    <main id="main" className="main-content">
      <header className="topbar"><span><span className="breadcrumb">Workspace</span><span className="slash">/</span>Overview</span><span className="semester"><Icon name="cap" size={18} />Student workspace</span></header>
      <section className="page-heading"><div><p className="eyebrow">A LITTLE STRUCTURE. MORE FOCUS.</p><h1>Make room for progress<span>.</span></h1><p>Your assignments, your pace. Keep the next step in sight.</p></div><button className="button primary" onClick={() => openEditor()} disabled={locked}><Icon name="plus" size={18} />New assignment</button></section>

      <section className="stats" aria-label="Assignment statistics">
        <div className="stat-card"><span className="stat-icon"><Icon name="book" /></span><div><p>Open assignments</p><strong>{list.status === 'success' ? open : '—'}</strong></div><span className="stat-note">On your radar</span></div>
        <div className="stat-card"><span className="stat-icon warm"><Icon name="clock" /></span><div><p>Estimated focus time</p><strong>{list.status === 'success' ? hours : '—'}<small> hrs</small></strong></div><span className="stat-note">For open tasks</span></div>
        <div className="stat-card"><span className="stat-icon lilac"><Icon name="check" /></span><div><p>Completed</p><strong>{list.status === 'success' ? completed : '—'}<small> / {list.data.length}</small></strong></div><span className="stat-note">{overdue ? `${overdue} overdue` : 'Keep it going'}</span></div>
      </section>

      {busy && <div className="notice info" role="status"><span className="spinner small" /><span>Saving “{mutation.title}”… You can still view other assignments.</span></div>}
      {notice && <div className={`notice ${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}><Icon name={notice.type === 'error' ? 'alert' : notice.type === 'success' ? 'check' : 'tune'} size={18} /><span>{notice.message}</span><button aria-label="Dismiss notification" onClick={() => setNotice(null)}><Icon name="close" size={16} /></button></div>}

      <div className="workspace-grid">
        <section className="assignments panel" aria-labelledby="assignments-title">
          <div className="section-heading"><div><h2 id="assignments-title">Your assignments <span>{tasks.length}</span></h2><p>Small steps. Meaningful progress.</p></div><button className="button reload-button" onClick={reloadList} disabled={busy || list.status === 'loading'}><Icon name="reload" size={16} />Reload</button></div>
          <label className="search-field"><Icon name="search" size={18} /><input aria-label="Search assignments" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search assignments or courses…" /></label>
          <div className="filter-tabs" role="group" aria-label="Filter assignments">{['All', 'To do', 'In progress', 'Completed'].map((value) => <button key={value} onClick={() => setFilter(value)} className={filter === value ? 'active' : ''} aria-pressed={filter === value}>{value}</button>)}</div>
          <TaskList list={list} tasks={tasks} selectedId={selectedId} onSelect={setSelectedId} onRetry={reloadList} onCreate={() => openEditor()} filtered={filter !== 'All' || !!search.trim()} />
          <div className="list-footer"><span className="status-dot" />{list.status === 'success' ? `${tasks.length} of ${list.data.length} assignments` : list.status === 'error' ? 'Connection needs attention' : 'Connecting to your workspace…'}</div>
        </section>
        <section className="details-panel panel" aria-label="Selected assignment">
          {selectedId && list.status === 'success' ? <TaskDetails key={selectedId} id={selectedId} revision={revision} locked={locked} onEdit={openEditor} onRemove={openRemove} onComplete={complete} /> : <div className="state-view empty-detail"><span className="state-icon"><Icon name="book" size={32} /></span><h3>Your next step starts here</h3><p>Select an assignment to see the full brief, make a change, or mark it complete.</p></div>}
        </section>
      </div>
      <NetworkPanel onNotice={(message, type) => setNotice({ message, type })} />
      <footer className="page-footer"><span>StudyFlow · A calmer place to get things done.</span><span>Saved in this browser</span></footer>
    </main>

    {editor && <TaskForm item={editor.item} busy={busy} error={mutationError} onClose={() => { if (!busy) setEditor(null); }} onSave={(values) => startMutation({ type: editor.item ? 'edit' : 'create', id: editor.item?.id, title: values.title.trim(), values })} />}
    {removing && <Modal title="Remove this assignment?" busy={busy} onClose={() => { if (!busy) setRemoving(null); }}><p className="remove-description">“{removing.title}” will be permanently removed from this browser.</p>{mutationError && <p className="inline-error" role="alert">{mutationError}</p>}<div className="modal-actions"><button autoFocus className="button secondary" disabled={busy} onClick={() => setRemoving(null)}>Keep assignment</button><button className="button danger" disabled={busy} onClick={() => startMutation({ type: 'remove', id: removing.id, title: removing.title })}>{busy ? 'Removing…' : 'Yes, remove'}</button></div></Modal>}
  </div>;
}
