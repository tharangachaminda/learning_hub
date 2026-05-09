import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
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
  @ViewChild('sidebarNav')
  private sidebarNav?: ElementRef<HTMLElement>;

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  protected readonly adminHeader = inject(AdminHeaderActionsService);
  private autoScrollFrame: number | null = null;
  private autoScrollVelocity = 0;
  private readonly autoScrollTriggerSize = 72;

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

  protected isNavItemActive(item: AdminNavItem): boolean {
    const url = this.router.url.split('?')[0];

    if (item.route === '/review') {
      return (
        url === '/review' ||
        (/^\/review\/[^/]+$/.test(url) && url !== '/review/export')
      );
    }

    return url === item.route;
  }

  protected logout(): void {
    this.stopSidebarAutoScroll();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  protected handleSidebarNavPointerMove(event: MouseEvent): void {
    const container = this.sidebarNav?.nativeElement;
    if (!container) {
      return;
    }

    const bounds = container.getBoundingClientRect();
    const distanceFromTop = event.clientY - bounds.top;
    const distanceFromBottom = bounds.bottom - event.clientY;

    if (distanceFromTop <= this.autoScrollTriggerSize) {
      this.setSidebarAutoScroll(
        -this.getAutoScrollVelocity(
          this.autoScrollTriggerSize - distanceFromTop
        )
      );
      return;
    }

    if (distanceFromBottom <= this.autoScrollTriggerSize) {
      this.setSidebarAutoScroll(
        this.getAutoScrollVelocity(
          this.autoScrollTriggerSize - distanceFromBottom
        )
      );
      return;
    }

    this.stopSidebarAutoScroll();
  }

  protected stopSidebarAutoScroll(): void {
    this.autoScrollVelocity = 0;

    if (this.autoScrollFrame !== null) {
      cancelAnimationFrame(this.autoScrollFrame);
      this.autoScrollFrame = null;
    }
  }

  ngOnDestroy(): void {
    this.stopSidebarAutoScroll();
  }

  private getActiveRoute(route: ActivatedRoute): ActivatedRoute {
    let current = route;
    while (current.firstChild) {
      current = current.firstChild;
    }
    return current;
  }

  private setSidebarAutoScroll(velocity: number): void {
    this.autoScrollVelocity = velocity;

    if (velocity === 0) {
      this.stopSidebarAutoScroll();
      return;
    }

    if (this.autoScrollFrame === null) {
      this.autoScrollFrame = requestAnimationFrame(() =>
        this.stepSidebarAutoScroll()
      );
    }
  }

  private stepSidebarAutoScroll(): void {
    const container = this.sidebarNav?.nativeElement;

    if (!container || this.autoScrollVelocity === 0) {
      this.stopSidebarAutoScroll();
      return;
    }

    const previousScrollTop = container.scrollTop;
    container.scrollTop += this.autoScrollVelocity;

    if (container.scrollTop === previousScrollTop) {
      this.stopSidebarAutoScroll();
      return;
    }

    this.autoScrollFrame = requestAnimationFrame(() =>
      this.stepSidebarAutoScroll()
    );
  }

  private getAutoScrollVelocity(distanceIntoZone: number): number {
    const progress = Math.min(
      Math.max(distanceIntoZone / this.autoScrollTriggerSize, 0),
      1
    );

    return Math.max(2, Math.ceil(progress * 12));
  }
}
