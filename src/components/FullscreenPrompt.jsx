import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

// Adapted from Les Défis du Savoir: fullscreen requires a gesture in THIS tab.
export function FullscreenPrompt({ requested }) {
  const [dismissed, setDismissed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { setDismissed(false); setError(''); }, [requested]);
  useEffect(() => {
    const sync = () => {
      const active = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
      setFullscreen(active);
      if (!active) setDismissed(false);
    };
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    sync();
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, []);
  if (!requested || dismissed || fullscreen) return null;
  async function enter() {
    try {
      const target = document.documentElement;
      const request = target.requestFullscreen || target.webkitRequestFullscreen;
      if (!request) throw new Error('Unsupported');
      await request.call(target);
      setDismissed(true);
    } catch { setError('Plein écran indisponible. Utilisez le raccourci du navigateur.'); }
  }
  return <div className="fixed bottom-10 left-1/2 z-[100] -translate-x-1/2 rounded-xl border border-yellow-300 bg-[#101833] p-3 text-center">
    <Button onClick={enter}>Passer la projection en plein écran</Button>
    <Button variant="secondary" onClick={() => setDismissed(true)}>Masquer l’invitation</Button>
    {error && <p role="status">{error}</p>}
  </div>;
}
