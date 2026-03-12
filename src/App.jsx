import { useEffect, useState } from 'react';
import { HomePage } from '@/pages/HomePage';
import { ControlPage } from '@/pages/ControlPage';

function normalizePath(pathname) {
  if (pathname === '/control') return '/control';
  return '/';
}

export default function App() {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((previous) => previous + 1);
    }, 120);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onPopState() {
      setPath(normalizePath(window.location.pathname));
    }

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return path === '/control' ? <ControlPage /> : <HomePage />;
}
