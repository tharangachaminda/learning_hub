import { Route } from '@angular/router';
import { LoginComponent } from './features/login/login';
import { DashboardComponent } from './features/dashboard/dashboard';
import { InviteComponent } from './features/invite/invite';
import { ManageUsersComponent } from './features/manage-users/manage-users';
import { authGuard } from './guards/auth.guard';

export const appRoutes: Route[] = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    title: 'Admin Dashboard',
    canActivate: [authGuard],
  },
  {
    path: 'users',
    component: ManageUsersComponent,
    title: 'Manage Users',
    canActivate: [authGuard],
  },
  {
    path: 'invite',
    component: InviteComponent,
    title: 'Invite User',
    canActivate: [authGuard],
  },
  {
    path: 'login',
    component: LoginComponent,
    title: 'Admin Login',
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
];
