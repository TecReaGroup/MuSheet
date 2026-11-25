import { LogIn } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import type { LoginRedirectState } from '@/feature/auth/require-session';
import { login, useSession } from '@/feature/auth/session-api';
import { describeError } from '@/shared/api/http-client';
import { Button } from '@/shared/ui/button';
import { Field, TextInput } from '@/shared/ui/form-field';
import { AppIcon, Wordmark } from '@/shared/ui/logo';
import { Spinner } from '@/shared/ui/spinner';

export function LoginPage() {
  const session = useSession();
  const navigate = useNavigate();
  const redirectTo = (useLocation().state as LoginRedirectState | null)?.from ?? '/';
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (session.data) return <Navigate to={redirectTo} replace />;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await login({ account, password });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setErrorMessage(describeError(error));
      setPassword('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <AppIcon className="size-16" />
          <Wordmark className="mt-4 text-[32px]" />
          <p className="mt-2 text-sm text-fg-quiet">登录管理员账号以访问乐谱库</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-panel border border-border bg-surface p-6 shadow-sm">
          <Field label="账号">
            <TextInput
              name="account"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              required
              value={account}
              onChange={event => setAccount(event.target.value)}
            />
          </Field>
          <Field label="密码">
            <TextInput
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={event => setPassword(event.target.value)}
            />
          </Field>

          {errorMessage && (
            <p role="alert" className="rounded-tag bg-danger-soft px-3 py-2 text-sm text-danger">{errorMessage}</p>
          )}

          <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting || !account.trim() || !password}>
            {isSubmitting ? <Spinner className="text-current" /> : <LogIn />}
            登录
          </Button>
        </form>
      </div>
    </main>
  );
}
