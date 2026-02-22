/**
 * Student Dashboard Component - Unit Tests
 *
 * Test Strategy: Validate the main dashboard shell component behavior.
 * - AC2: Welcome banner with student name and time-of-day greeting
 * - AC11: Child-friendly design with emoji icons
 * - AC19: Loading state with skeleton loaders
 * - AC20: Error handling with friendly messages
 * - AC25: Screen reader compatibility with ARIA labels
 */

import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { StudentDashboardComponent } from './student-dashboard.component';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { DashboardData } from '../../models/dashboard.model';

/**
 * Factory for mock DashboardData used across dashboard component tests.
 *
 * @returns Complete DashboardData fixture
 */
function createMockDashboardData(): DashboardData {
  return {
    student: {
      id: 'student-1',
      firstName: 'Alice',
      lastName: 'Smith',
      grade: 3,
      avatarUrl: '/assets/avatars/avatar-2.svg',
    },
    dailyGoal: {
      targetMinutes: 30,
      completedMinutes: 18,
      percentage: 60,
    },
    streak: {
      current: 5,
      longest: 12,
    },
    recommendations: [
      {
        id: 'rec-1',
        topic: 'Fractions',
        subject: 'math',
        reason: 'You struggled with fractions last session',
        difficulty: 'medium',
        estimatedMinutes: 10,
      },
    ],
    recentActivity: [
      {
        id: 'session-1',
        subject: 'math',
        topic: 'Addition',
        score: 80,
        questionsAnswered: 10,
        correctAnswers: 8,
        completedAt: '2026-02-20T14:30:00Z',
        durationMinutes: 15,
      },
    ],
    achievements: [
      {
        id: 'first_steps',
        name: 'First Steps',
        description: 'Answer 10 questions correctly',
        category: 'milestone',
        badgeIcon: 'badge-first-steps',
        pointValue: 10,
        unlocked: true,
        unlockedDate: new Date('2026-01-10'),
        progress: 100,
      },
    ],
    subjects: [
      {
        subject: 'math',
        displayName: 'Mathematics',
        icon: '🔢',
        masteryPercentage: 65,
        questionsAnswered: 120,
        lastPracticed: '2026-02-20T14:30:00Z',
      },
    ],
  };
}

describe('StudentDashboardComponent', () => {
  let component: StudentDashboardComponent;
  let fixture: ComponentFixture<StudentDashboardComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentDashboardComponent],
      providers: [
        DashboardService,
        { provide: AuthService, useValue: { getUserId: () => null } },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentDashboardComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  describe('welcome greeting (AC2)', () => {
    /**
     * Test: Time-of-day greeting logic
     * Why Essential: AC2 requires motivational message based on time
     * Impact: Welcome banner must show correct greeting
     */
    it('should return "Good morning" for morning hours (5-11)', () => {
      expect(component.getGreeting(7)).toBe('Good morning');
      expect(component.getGreeting(5)).toBe('Good morning');
      expect(component.getGreeting(11)).toBe('Good morning');
    });

    it('should return "Good afternoon" for afternoon hours (12-16)', () => {
      expect(component.getGreeting(12)).toBe('Good afternoon');
      expect(component.getGreeting(14)).toBe('Good afternoon');
      expect(component.getGreeting(16)).toBe('Good afternoon');
    });

    it('should return "Good evening" for evening hours (17-4)', () => {
      expect(component.getGreeting(17)).toBe('Good evening');
      expect(component.getGreeting(20)).toBe('Good evening');
      expect(component.getGreeting(3)).toBe('Good evening');
    });
  });

  describe('dashboard data loading (AC18, AC19)', () => {
    /**
     * Test: Loading state management
     * Why Essential: AC19 requires skeleton loaders during load
     * Impact: User sees loading feedback while data fetches
     */
    it('should set loading to true initially', () => {
      expect(component.loading).toBe(true);
    });

    it('should load dashboard data on init and set loading to false', () => {
      const mockData = createMockDashboardData();

      fixture.detectChanges(); // triggers ngOnInit

      const req = httpMock.expectOne(
        `/api/students/${component.studentId}/dashboard`
      );
      req.flush(mockData);

      expect(component.loading).toBe(false);
      expect(component.dashboardData).toEqual(mockData);
      expect(component.dashboardData?.student.firstName).toBe('Alice');
    });
  });

  describe('error handling (AC20)', () => {
    /**
     * Test: Friendly error message on API failure
     * Why Essential: AC20 requires friendly error messages, not crashes
     * Impact: Student sees helpful message instead of blank screen
     */
    it('should display error message when API call fails', () => {
      fixture.detectChanges(); // triggers ngOnInit

      const req = httpMock.expectOne(
        `/api/students/${component.studentId}/dashboard`
      );
      req.flush('Server Error', {
        status: 500,
        statusText: 'Internal Server Error',
      });

      expect(component.loading).toBe(false);
      expect(component.error).toBeTruthy();
      expect(component.error).toContain('load');
    });
  });

  describe('template rendering (AC2, AC11, AC25)', () => {
    /**
     * Test: Welcome banner with student name renders in DOM
     * Why Essential: AC2 requires showing student name
     * Impact: Student must see personalized greeting
     */
    it('should render welcome banner with student name after data loads', () => {
      const mockData = createMockDashboardData();

      fixture.detectChanges();

      const req = httpMock.expectOne(
        `/api/students/${component.studentId}/dashboard`
      );
      req.flush(mockData);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const welcomeBanner = compiled.querySelector(
        '[data-testid="welcome-banner"]'
      );
      expect(welcomeBanner).toBeTruthy();
      expect(welcomeBanner?.textContent).toContain('Alice');
    });

    it('should show loading indicator while data is loading', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const loader = compiled.querySelector(
        '[data-testid="dashboard-loading"]'
      );
      expect(loader).toBeTruthy();

      // Flush the pending request to prevent afterEach verify error
      const req = httpMock.expectOne(
        `/api/students/${component.studentId}/dashboard`
      );
      req.flush(createMockDashboardData());
    });

    it('should show error message when error state is active', () => {
      fixture.detectChanges();

      const req = httpMock.expectOne(
        `/api/students/${component.studentId}/dashboard`
      );
      req.flush('Server Error', {
        status: 500,
        statusText: 'Internal Server Error',
      });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const errorMsg = compiled.querySelector(
        '[data-testid="dashboard-error"]'
      );
      expect(errorMsg).toBeTruthy();
      expect(errorMsg?.textContent).toContain('load');
    });

    it('should have proper ARIA label on dashboard container (AC25)', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const dashboard = compiled.querySelector('[role="main"]');
      expect(dashboard).toBeTruthy();
      expect(dashboard?.getAttribute('aria-label')).toContain('dashboard');

      // Flush pending request
      const req = httpMock.expectOne(
        `/api/students/${component.studentId}/dashboard`
      );
      req.flush(createMockDashboardData());
    });
  });
});
