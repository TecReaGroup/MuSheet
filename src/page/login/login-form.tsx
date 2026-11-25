import { ArrowRight, CircleAlert, Eye, EyeOff } from 'lucide-react';
import { useState, type FormEvent, type InputHTMLAttributes } from 'react';
import { login } from '@/feature/auth/session-api';
import { describeError } from '@/shared/api/http-client';
import { useText } from '@/shared/i18n/text';
import { Button } from '@/shared/ui/button';
import { Field, TextInput } from '@/shared/ui/form-field';
import { Spinner } from '@/shared/ui/spinner';
import { LOGIN_TEXT, type LoginText } from './login-text';

/** Credentials form; calls `onLoggedIn` once the session is stored so the page decides where to go. */
export function LoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const text = useText(LOGIN_TEXT);
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Keep the raw error, not its message, so switching language re-translates it.
  const [loginError, setLoginError] = useState<unknown>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setLoginError(null);
    try {
      await login({ account, password });
      onLoggedIn();
    } catch (error) {
      setLoginError(error);
      setPassword('');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-7 space-y-5">
      <Field label={text.account}>
        <TextInput
          name="account"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          required
          value={account}
          onChange={event => setAccount(event.target.value)}
          className="h-12 bg-stone-50 dark:bg-canvas"
        />
      </Field>
      <Field label={text.password}>
        <PasswordInput
          text={text}
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={event => setPassword(event.target.value)}
        />
      </Field>

      {loginError !== null && (
        <p role="alert" className="flex items-center gap-2 rounded-card bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          <CircleAlert className="size-4 shrink-0" />
          {describeError(loginError)}
        </p>
      )}

      <Button type="submit" variant="primary" size="lg" className="mt-3 w-full" disabled={isSubmitting || !account.trim() || !password}>
        {isSubmitting ? text.submitting : text.submit}
        {isSubmitting ? <Spinner className="text-current" /> : <ArrowRight />}
      </Button>
    </form>
  );
}

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { text: LoginText };

function PasswordInput({ text, ...inputProps }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ToggleIcon = isVisible ? EyeOff : Eye;

  return (
    <span className="relative block">
      <TextInput type={isVisible ? 'text' : 'password'} className="h-12 bg-stone-50 pr-12 dark:bg-canvas" {...inputProps} />
      <button
        type="button"
        onClick={() => setIsVisible(visible => !visible)}
        aria-label={isVisible ? text.hidePassword : text.showPassword}
        className="absolute top-1/2 right-2 -translate-y-1/2 rounded-tag p-1.5 text-fg-subtle hover:bg-muted hover:text-fg"
      >
        <ToggleIcon className="size-4.5" />
      </button>
    </span>
  );
}
