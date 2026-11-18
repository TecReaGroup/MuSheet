import { useNavigate } from 'react-router';

/** Back within the app when there is in-app history, otherwise to `fallback` (e.g. a shared deep link). */
export function useGoBack(fallback: string) {
  const navigate = useNavigate();
  return () => {
    // React Router stores the history index in history.state; 0 means this is the first in-app entry.
    const historyIndex = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (historyIndex > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  };
}
