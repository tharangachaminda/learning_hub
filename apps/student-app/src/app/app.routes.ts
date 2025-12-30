import { Route } from '@angular/router';
import { BadgeGalleryComponent } from './features/achievements/components/badge-gallery/badge-gallery.component';

export const appRoutes: Route[] = [
  {
    path: 'achievements',
    component: BadgeGalleryComponent,
    title: 'My Achievements',
  },
  {
    path: '',
    redirectTo: 'achievements',
    pathMatch: 'full',
  },
];
