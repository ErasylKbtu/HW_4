import { useEffect, useState } from 'react';
import { PRIORITIES, STATUSES } from '../api/fakeApi.js';
import Icon from './Icon.jsx';

export function Modal({ title, busy, onClose, children }) {
  useEffect(() => {
    const dialog = document.getElementById('task-dialog');
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return <dialog id="task-dialog" aria-labelledby="dialog-title" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="modal-heading"><div><p className="eyebrow">YOUR STUDY SPACE</p><h2 id="dialog-title">{title}</h2></div><button className="icon-button" aria-label="Close dialog" disabled={busy} onClick={onClose}><Icon name="close" /></button></div>
    {children}
  </dialog>;
}

export default function TaskForm({ item, busy, error, onSave, onClose }) {
  const [form, setForm] = useState(() => item || {
    title: '', course: '', instructor: '', dueDate: '', priority: 'Medium',
    status: 'To do', estimatedHours: '2', description: '', notes: '',
  });
  function change(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }
  function submit(event) {
    event.preventDefault();
    if (!busy) onSave(form);
  }

  return <Modal title={item ? 'Edit assignment' : 'A little plan. A big step.'} busy={busy} onClose={onClose}>
    <form onSubmit={submit}>
      {error && <p className="inline-error" role="alert">{error}</p>}
      <fieldset disabled={busy}>
        <label>Assignment title<input autoFocus name="title" value={form.title} onChange={change} maxLength={100} required placeholder="What are you working on?" /></label>
        <div className="form-grid"><label>Course<input name="course" value={form.course} onChange={change} maxLength={80} required placeholder="e.g. React Development" /></label><label>Instructor<input name="instructor" value={form.instructor} onChange={change} maxLength={80} required placeholder="Name or role" /></label></div>
        <label>Description<textarea name="description" value={form.description} onChange={change} maxLength={2000} required rows={3} placeholder="Describe the goal and expected result." /></label>
        <div className="form-grid"><label>Due date<input name="dueDate" type="date" value={form.dueDate} onChange={change} required /></label><label>Estimated hours<input name="estimatedHours" type="number" min="0.5" max="100" step="0.5" value={form.estimatedHours} onChange={change} required /></label><label>Priority<select name="priority" value={form.priority} onChange={change}>{PRIORITIES.map((value) => <option key={value}>{value}</option>)}</select></label><label>Status<select name="status" value={form.status} onChange={change}>{STATUSES.map((value) => <option key={value}>{value}</option>)}</select></label></div>
        <label>Notes <span className="optional">(optional)</span><textarea name="notes" value={form.notes} onChange={change} maxLength={2000} rows={2} placeholder="Links, reminders, or your next step." /></label>
      </fieldset>
      <div className="modal-actions"><button type="button" className="button secondary" onClick={onClose} disabled={busy}>Cancel</button><button className="button primary" type="submit" disabled={busy}>{busy ? <><span className="spinner small" />Saving…</> : item ? 'Save changes' : 'Create assignment'}</button></div>
    </form>
  </Modal>;
}
