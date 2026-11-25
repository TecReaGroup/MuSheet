import { Navigate, Outlet, useLocation } from 'react-router';
import { COMMON_TEXT } from '@/shared/i18n/common-text';
import { useText } from '@/shared/i18n/text';
import { Button } from '@/shared/ui/button';
import { Spinner } from '@/shared/ui/spinner';
import { useSession } from './session-api';

export interface LoginRedirectState {
  from?: string;
}

/** Layout route that only renders its children for a logged-in admin. */
export function RequireSession() {
  const session = useSession();
  const location = useLocation();
  const text = useText(COMMON_TEXT);

  if (session.isPending) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas">
        <Spinner className="size-6 animate-deferred-in" />
      </div>
    );
  }
  if (session.isError) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-canvas text-body text-fg-muted">
        {text.serverUnreachable}
        <Button size="sm" onClick={() => void session.refetch()}>{text.retry}</Button>
      </div>
    );
  }
  if (!session.data) {
    const state: LoginRedirectState = { from: `${location.pathname}${location.search}` };
    return <Navigate to="/login" replace state={state} />;
  }
  return <Outlet />;
}
