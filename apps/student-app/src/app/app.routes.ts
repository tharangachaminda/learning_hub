import { Route } from '@angular/router';
import { BadgeGalleryComponent } from './features/achievements/components/badge-gallery/badge-gallery.component';
import { Registration } from './features/registration';

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
    path: '',
    redirectTo: 'achievements',
    pathMatch: 'full',
  },
];
