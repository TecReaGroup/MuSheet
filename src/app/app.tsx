import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { useApplyTheme } from '@/feature/preference/use-apply-theme';
import { queryClient } from '@/shared/api/query-client';
import { useApplyLocale } from '@/shared/i18n/use-apply-locale';
import { router } from './router';

export function App() {
  useApplyTheme();
  useApplyLocale();
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="bottom-center"
        offset={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}
        mobileOffset={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))', left: 16, right: 16 }}
        toastOptions={{ className: 'rounded-tag! border-0! bg-inverse! text-on-inverse! text-sm! shadow-float! [&_[data-button]]:bg-on-inverse/15! [&_[data-button]]:text-on-inverse!' }}
      />
    </QueryClientProvider>
  );
}
