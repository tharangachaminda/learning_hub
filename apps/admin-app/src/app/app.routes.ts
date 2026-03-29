import { Route } from '@angular/router';
import { LoginComponent } from './features/login/login';
import { DashboardComponent } from './features/dashboard/dashboard';
import { InviteComponent } from './features/invite/invite';
import { ManageUsersComponent } from './features/manage-users/manage-users';
import { GenerateQuestionsComponent } from './features/generate-questions/generate-questions';
import { ReviewQueueComponent } from './features/review-queue/review-queue';
import { QuestionDetailComponent } from './features/question-detail/question-detail';
import { LessonsLearnedComponent } from './features/lessons-learned/lessons-learned';
import { authGuard } from './guards/auth.guard';

export const appRoutes: Route[] = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    title: 'Admin Dashboard',
    canActivate: [authGuard],
  },
  {
    path: 'generate',
    component: GenerateQuestionsComponent,
    title: 'Generate Questions',
    canActivate: [authGuard],
  },
  {
    path: 'review',
    component: ReviewQueueComponent,
    title: 'Review Queue',
    canActivate: [authGuard],
  },
  {
    path: 'review/:id',
    component: QuestionDetailComponent,
    title: 'Question Detail',
    canActivate: [authGuard],
  },
  {
    path: 'lessons-learned',
    component: LessonsLearnedComponent,
    title: 'Lessons Learned',
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
