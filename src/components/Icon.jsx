const paths = {
  book: 'M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-3H4V4Zm16 0h-4a3 3 0 0 0-3 3v14a4 4 0 0 1 4-3h3V4Z',
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  check: 'm5 12 4 4L19 6',
  plus: 'M12 5v14M5 12h14',
  reload: 'M20 7v5h-5M4 17v-5h5M6.2 7a7 7 0 0 1 11.6-1L20 9M4 15l2.2 3A7 7 0 0 0 18 17',
  search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  clock: 'M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  calendar: 'M4 6h16v15H4zM8 3v6M16 3v6M4 11h16',
  arrow: 'M5 12h14m-5-5 5 5-5 5',
  edit: 'm15 4 5 5M4 20l5-1L21 7l-5-5L4 14v6Z',
  trash: 'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7',
  close: 'm6 6 12 12M6 18 18 6',
  alert: 'M12 3 2 21h20L12 3ZM12 9v5M12 17v1',
  tune: 'M4 7h16M4 17h16M8 4v6M16 14v6',
  cap: 'm2 9 10-5 10 5-10 5L2 9Zm4 2v7c4 3 8 3 12 0v-7M22 9v7',
};

export default function Icon({ name, size = 20, className = '' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}><path d={paths[name] || paths.book} /></svg>;
}
