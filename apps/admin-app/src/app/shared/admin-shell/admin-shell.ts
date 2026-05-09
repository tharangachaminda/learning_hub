import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  Router,
  RouterModule,
  ActivatedRoute,
  NavigationEnd,
} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowRightFromBracket,
  faBars,
  faBookOpen,
  faChartColumn,
  faChevronRight,
  faFileCircleCheck,
  faGaugeHigh,
  faLightbulb,
  faRobot,
  faUsersGear,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../services/auth.service';
import { AdminHeaderActionsService } from './admin-header-actions.service';

interface AdminNavItem {
  label: string;
  description: string;
  route: string;
  icon: IconDefinition;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.scss',
})
export class AdminShellComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  protected readonly adminHeader = inject(AdminHeaderActionsService);

  protected readonly menuIcon = faBars;
  protected readonly chevronIcon = faChevronRight;
  protected readonly logoutIcon = faArrowRightFromBracket;
  protected readonly currentUser = this.authService.getUser();
  protected readonly isAdmin = this.authService.isAdmin();
  protected sidebarOpen = false;
  protected currentTitle = 'Admin Workspace';
  protected currentDescription =
    'Manage question generation, review workflows, and coverage insights.';

  protected readonly navItems: AdminNavItem[] = [
    {
      label: 'Dashboard',
      description: 'Overview and quick actions',
      route: '/dashboard',
      icon: faGaugeHigh,
    },
    {
      label: 'Analytics',
      description: 'Coverage, health, and quality trends',
      route: '/analytics',
      icon: faChartColumn,
    },
    {
      label: 'Generate',
      description: 'Create curriculum-aligned questions',
      route: '/generate',
      icon: faRobot,
    },
    {
      label: 'Review Queue',
      description: 'Approve, reject, and refine drafts',
      route: '/review',
      icon: faFileCircleCheck,
    },
    {
      label: 'Lessons Learned',
      description: 'Track prompt corrections and patterns',
      route: '/lessons-learned',
      icon: faLightbulb,
    },
    {
      label: 'Manage Users',
      description: 'Staff accounts and permissions',
      route: '/users',
      icon: faUsersGear,
      adminOnly: true,
    },
    {
      label: 'PDF Export',
      description: 'Build printable worksheet packs',
      route: '/review/export',
      icon: faBookOpen,
    },
  ];

  constructor() {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd
        ),
        startWith(null),
        map(() => this.getActiveRoute(this.activatedRoute)),
        takeUntilDestroyed()
      )
      .subscribe((route) => {
        this.currentTitle = route.snapshot.title ?? 'Admin Workspace';
        this.currentDescription =
          route.snapshot.data['shellDescription'] ??
          'Manage question generation, review workflows, and coverage insights.';
        this.sidebarOpen = false;
      });
  }

  protected get visibleNavItems(): AdminNavItem[] {
    return this.navItems.filter((item) => !item.adminOnly || this.isAdmin);
  }

  protected toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  protected closeSidebar(): void {
    this.sidebarOpen = false;
  }

  protected logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private getActiveRoute(route: ActivatedRoute): ActivatedRoute {
    let current = route;
    while (current.firstChild) {
      current = current.firstChild;
    }
    return current;
  }
}
