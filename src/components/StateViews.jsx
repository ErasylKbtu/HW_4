import Icon from './Icon.jsx';

export function Loading({ text = 'Loading assignments…' }) {
  return <div className="state-view" role="status"><span className="spinner" /><p>{text}</p></div>;
}

export function ErrorView({ message, onRetry, title = 'Something went wrong' }) {
  return <div className="state-view error-view" role="alert"><span className="state-icon"><Icon name="alert" size={26} /></span><h3>{title}</h3><p>{message}</p><button className="button secondary" onClick={onRetry}><Icon name="reload" size={16} />Try again</button></div>;
}

export function Badge({ type, children }) {
  return <span className={`badge badge-${String(type || children).toLowerCase().replaceAll(' ', '-')}`}>{children}</span>;
}
