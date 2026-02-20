import { Route } from '@angular/router';
import { BadgeGalleryComponent } from './features/achievements/components/badge-gallery/badge-gallery.component';
import { Login } from './features/login/login';
import { Registration } from './features/registration';
import { QuestionGeneratorComponent } from './features/practice/question-generator/question-generator';
import { authGuard } from './guards/auth.guard';

export const appRoutes: Route[] = [
  {
    path: 'achievements',
    component: BadgeGalleryComponent,
    title: 'My Achievements',
    canActivate: [authGuard],
  },
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
  {
    path: 'practice',
    canActivate: [authGuard],
    children: [
      {
        path: 'generate',
        component: QuestionGeneratorComponent,
        title: 'AI Question Generator',
      },
    ],
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
