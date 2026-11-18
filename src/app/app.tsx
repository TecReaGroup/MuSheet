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
        position="bottom-center"
        offset={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}
        mobileOffset={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))', left: 16, right: 16 }}
        toastOptions={{ className: 'rounded-tag! border-0! bg-gray-700! text-white! text-sm! shadow-float! [&_[data-button]]:bg-white/15! [&_[data-button]]:text-white!' }}
      />
    </QueryClientProvider>
  );
}
