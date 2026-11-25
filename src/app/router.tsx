import { createBrowserRouter, Navigate } from 'react-router';
import { RequireSession } from '@/feature/auth/require-session';
import { HomePage } from '@/page/home/home-page';
import { LibraryPage } from '@/page/library/library-page';
import { LoginPage } from '@/page/login/login-page';
import { ScoreDetailPage } from '@/page/score-detail/score-detail-page';
import { SetlistDetailPage } from '@/page/setlist-detail/setlist-detail-page';
import { SETTING_ROUTE } from '@/page/setting/setting-layout';
import { ViewerPage } from '@/page/viewer/viewer-page';
import { AppShell } from './app-shell';
import { RootLayout } from './root-layout';

export const router = createBrowserRouter([
  { path: 'login', element: <LoginPage /> },
  {
    element: <RequireSession />,
    children: [
      {
        element: <RootLayout />,
        children: [
          {
            element: <AppShell />,
            children: [
              { index: true, element: <HomePage /> },
              { path: 'library', element: <LibraryPage key="personal" space="personal" /> },
              { path: 'team', element: <LibraryPage key="team" space="team" /> },
              { path: 'score/:scoreId', element: <ScoreDetailPage /> },
              { path: 'setlist/:setlistId', element: <SetlistDetailPage /> },
            ],
          },
          SETTING_ROUTE,
          { path: 'view/:partId', element: <ViewerPage /> },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
]);
