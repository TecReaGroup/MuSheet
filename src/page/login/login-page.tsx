import { LockKeyhole } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import type { LoginRedirectState } from '@/feature/auth/require-session';
import { useSession } from '@/feature/auth/session-api';
import { LocaleMenu } from '@/feature/preference/locale-menu';
import { useText } from '@/shared/i18n/text';
import { Wordmark } from '@/shared/ui/logo';
import { LoginForm } from './login-form';
import { LOGIN_TEXT } from './login-text';

export function LoginPage() {
  const session = useSession();
  const navigate = useNavigate();
  const redirectTo = (useLocation().state as LoginRedirectState | null)?.from ?? '/';
  const text = useText(LOGIN_TEXT);

  if (session.data) return <Navigate to={redirectTo} replace />;

  return (
    <main className="flex min-h-dvh flex-col bg-stone-100 dark:bg-canvas">
      <header className="flex items-center justify-between gap-4 px-5 py-4">
        <Wordmark className="text-[30px]" />
        <LocaleMenu />
      </header>

      <section className="flex flex-1 items-center justify-center px-5 pb-20">
        <div className="w-full max-w-[400px] rounded-sheet border border-border bg-surface p-8 shadow-[0_8px_32px_rgb(0_0_0/0.06)] dark:shadow-none">
          <div className="flex flex-col items-start text-left">
            <div className="flex size-11 items-center justify-center rounded-card bg-score-soft text-score">
              <LockKeyhole className="size-5" />
            </div>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-fg">{text.title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-fg-quiet">{text.subtitle}</p>
          </div>
          <LoginForm onLoggedIn={() => navigate(redirectTo, { replace: true })} />
        </div>
      </section>
    </main>
  );
}
