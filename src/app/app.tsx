import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { useApplyTheme } from '@/feature/preference/use-apply-theme';
import { queryClient } from '@/shared/api/query-client';
import { router } from './router';

export function App() {
  useApplyTheme();
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        offset={16}
        toastOptions={{ className: 'rounded-card! border-border! bg-surface-raised! text-fg! shadow-float!' }}
      />
    </QueryClientProvider>
  );
}
