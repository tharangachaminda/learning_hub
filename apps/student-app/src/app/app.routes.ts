import { Route } from '@angular/router';
import { BadgeGalleryComponent } from './features/achievements/components/badge-gallery/badge-gallery.component';
import { Login } from './features/login/login';
import { questionGeneratorPendingExitGuard } from './features/practice/question-generator/question-generator-deactivation.guard';
import { Registration } from './features/registration';
import { QuestionGeneratorComponent } from './features/practice/question-generator/question-generator';
import { StudentPerformanceComponent } from './features/student-performance/student-performance.component';
import { StudentDashboardComponent } from './features/student-dashboard/student-dashboard.component';
import { authGuard } from './guards/auth.guard';
import { AuthShellComponent } from './layouts/auth-shell/auth-shell.component';
import { StudentShellComponent } from './layouts/student-shell/student-shell.component';

export const appRoutes: Route[] = [
  {
    path: '',
    component: AuthShellComponent,
    children: [
      {
        path: 'register',
        component: Registration,
        title: 'Student Registration',
      },
      {
        path: 'login',
        component: Login,
        title: 'Student Login',
      },
    ],
  },
  {
    path: '',
    component: StudentShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: StudentDashboardComponent,
        title: 'My Dashboard',
      },
      {
        path: 'achievements',
        component: BadgeGalleryComponent,
        title: 'My Achievements',
      },
      {
        path: 'performance',
        component: StudentPerformanceComponent,
        title: 'My Performance',
      },
      {
        path: 'practice',
        children: [
          {
            path: 'generate',
            component: QuestionGeneratorComponent,
            canDeactivate: [questionGeneratorPendingExitGuard],
            title: 'AI Question Generator',
          },
        ],
      },
    ],
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
];
