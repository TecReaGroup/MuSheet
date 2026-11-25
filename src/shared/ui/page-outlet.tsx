import { Outlet, useLocation } from 'react-router';

/**
 * Route outlet that fades each page in on navigation.
 * Keyed by pathname only, so search-param changes (tabs, queries) keep the page mounted.
 */
export function PageOutlet() {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="animate-page-in">
      <Outlet />
    </div>
  );
}
