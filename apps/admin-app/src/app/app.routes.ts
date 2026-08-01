import { Route } from '@angular/router';
import { LoginComponent } from './features/login/login';
import { DashboardComponent } from './features/dashboard/dashboard';
import { InviteComponent } from './features/invite/invite';
import { ManageUsersComponent } from './features/manage-users/manage-users';
import { GenerateQuestionsComponent } from './features/generate-questions/generate-questions';
import { ReviewQueueComponent } from './features/review-queue/review-queue';
import { QuestionDetailComponent } from './features/question-detail/question-detail';
import { LessonsLearnedComponent } from './features/lessons-learned/lessons-learned';
import { AnalyticsComponent } from './features/analytics/analytics';
import { authGuard } from './guards/auth.guard';
import { AdminShellComponent } from './shared/admin-shell/admin-shell';
import { VisualCatalogPreviewComponent } from './features/visual-catalog-preview/visual-catalog-preview';
import { CreateQuestionComponent } from './features/create-question/create-question';

export const appRoutes: Route[] = [
  {
    path: 'login',
    component: LoginComponent,
    title: 'Admin Login',
  },
  {
    path: '',
    component: AdminShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent,
        title: 'Question Operations',
        data: {
          shellDescription:
            'Track review volume, coverage health, and the fastest route into action.',
        },
      },
      {
        path: 'analytics',
        component: AnalyticsComponent,
        title: 'Question Analytics',
        data: {
          shellDescription:
            'Inspect coverage quality, generation balance, and topic health across the curriculum.',
        },
      },
      {
        path: 'generate',
        component: GenerateQuestionsComponent,
        title: 'Generate Question Batches',
        data: {
          shellDescription:
            'Create new question batches with tighter control over grade, topic, and difficulty.',
        },
      },
      {
        path: 'create',
        component: CreateQuestionComponent,
        title: 'Create Question',
        data: {
          shellDescription:
            'Manually author a question, attach visuals from the image library, and submit it for review.',
        },
      },
      {
        path: 'review',
        component: ReviewQueueComponent,
        title: 'Queue Control',
        data: {
          shellDescription:
            'Triage pending drafts, bulk actions, and indexing status from one review surface.',
        },
      },
      {
        path: 'review/export',
        loadComponent: () =>
          import('./features/export-questions/export-questions').then(
            (module) => module.ExportQuestionsComponent
          ),
        title: 'Worksheet PDF Export',
        data: {
          shellDescription:
            'Assemble approved questions into printable worksheet packs with answer sheets.',
        },
      },
      {
        path: 'visual-catalog',
        component: VisualCatalogPreviewComponent,
        title: 'Visual Catalog',
        data: {
          shellDescription:
            'Inspect approved SVG assets, metadata, and curriculum coverage before using them in generated questions.',
        },
      },
      {
        path: 'review/:id',
        component: QuestionDetailComponent,
        title: 'Question Detail',
        data: {
          shellDescription:
            'Inspect question content, revisions, and review actions in detail.',
        },
      },
      {
        path: 'lessons-learned',
        component: LessonsLearnedComponent,
        title: 'Lessons Learned',
        data: {
          shellDescription:
            'Maintain correction guidance so generation prompts avoid repeating known mistakes.',
        },
      },
      {
        path: 'users',
        component: ManageUsersComponent,
        title: 'Manage Users',
        data: {
          shellDescription:
            'Control staff access, activation state, and invitation workflows.',
        },
      },
      {
        path: 'invite',
        component: InviteComponent,
        title: 'Invite User',
        data: {
          shellDescription:
            'Create a new admin or teacher account with secure onboarding details.',
        },
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
];
