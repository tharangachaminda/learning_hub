/**
 * Functional route guard that protects routes from unauthenticated access.
 *
 * Checks if the user has a valid authentication token via AuthService.
 * Redirects to the login page if not authenticated.
 *
 * @param route - The activated route snapshot
 * @param state - The router state snapshot
 * @returns `true` if authenticated, or a UrlTree redirecting to `/login`
 *
 * @example
 * ```typescript
 * // In route configuration:
 * {
 *   path: 'dashboard',
 *   component: DashboardComponent,
 *   canActivate: [authGuard],
 * }
 * ```
 */
import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
