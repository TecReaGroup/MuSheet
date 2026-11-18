import { useEffect, useState } from 'react';
import { log } from '@/shared/lib/logger';

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(document.fullscreenElement));

  useEffect(() => {
    const handleChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const toggle = () => {
    const request = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    request.catch(error => log('warn', 'Fullscreen', 'Fullscreen request failed', { message: String(error) }));
  };

  // iPhone Safari has no Fullscreen API; there the PWA's standalone mode serves the same purpose.
  return { isSupported: Boolean(document.fullscreenEnabled), isFullscreen, toggle };
}
