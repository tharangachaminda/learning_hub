import { Route } from '@angular/router';
import { BadgeGalleryComponent } from './features/achievements/components/badge-gallery/badge-gallery.component';
import { Registration } from './features/registration';
import { QuestionGeneratorComponent } from './features/practice/question-generator/question-generator';

export const appRoutes: Route[] = [
  {
    path: 'achievements',
    component: BadgeGalleryComponent,
    title: 'My Achievements',
  },
  {
    path: 'register',
    component: Registration,
    title: 'Student Registration',
  },
  {
    path: 'practice',
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
    redirectTo: 'achievements',
    pathMatch: 'full',
  },
];
