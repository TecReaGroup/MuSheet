import { useEffect } from 'react';
import { log } from '@/shared/lib/logger';

/** Keeps the screen on while reading. The browser drops the lock when the tab hides, so it is re-acquired. */
export function useWakeLock() {
  useEffect(() => {
    if (!('wakeLock' in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let disposed = false;

    const acquire = async () => {
      try {
        sentinel = await navigator.wakeLock.request('screen');
        if (disposed) void sentinel.release();
      } catch (error) {
        // Expected on insecure origins (http://<LAN IP>) and when battery saver denies it.
        log('debug', 'WakeLock', 'Wake lock unavailable', { message: String(error) });
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !disposed) void acquire();
    };

    void acquire();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      void sentinel?.release();
    };
  }, []);
}
