import { useEffect, useState } from 'react';
import { HomePage } from '@/pages/HomePage';
import { ControlPage } from '@/pages/ControlPage';

function normalizePath(pathname) {
  if (pathname.replace(/\/$/, '') === '/control') return '/control';
  return '/';
}

export default function App() {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));
  useEffect(() => {
    function onPopState() {
      setPath(normalizePath(window.location.pathname));
    }

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return path === '/control' ? <ControlPage /> : <HomePage />;
}
