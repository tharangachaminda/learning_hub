/**
 * Dashboard Service - Unit Tests
 *
 * Test Strategy: Validate API integration for all dashboard endpoints.
 * - AC18: Integrates with student progress API endpoints
 * - getDashboardData → GET /api/students/{id}/dashboard
 * - getRecommendations → GET /api/students/{id}/recommendations
 * - getProgressSummary → GET /api/students/{id}/progress/summary
 * - getRecentAchievements → GET /api/students/{id}/achievements/recent
 */

import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DashboardService } from './dashboard.service';
import {
  DashboardData,
  TopicRecommendation,
  SubjectProgress,
} from '../models/dashboard.model';
import { Achievement } from '../models/achievement.model';

/**
 * Factory for mock DashboardData used across tests.
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

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DashboardService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDashboardData', () => {
    /**
     * Test: Fetch aggregated dashboard data (AC18)
     * Why Essential: Main dashboard endpoint provides all section data
     * Impact: Dashboard cannot render without this data
     */
    it('should retrieve dashboard data from GET /api/students/{id}/dashboard', () => {
      const studentId = 'student-1';
      const mockData = createMockDashboardData();

      service.getDashboardData(studentId).subscribe((data) => {
        expect(data).toEqual(mockData);
        expect(data.student.firstName).toBe('Alice');
        expect(data.dailyGoal.percentage).toBe(60);
        expect(data.streak.current).toBe(5);
      });

      const req = httpMock.expectOne(`/api/students/${studentId}/dashboard`);
      expect(req.request.method).toBe('GET');
      req.flush(mockData);
    });
  });

  describe('getRecommendations', () => {
    /**
     * Test: Fetch AI recommendations (AC5, AC22)
     * Why Essential: Personalized topic suggestions drive engagement
     * Impact: AI recommendations section would be empty
     */
    it('should retrieve recommendations from GET /api/students/{id}/recommendations', () => {
      const studentId = 'student-1';
      const mockRecs: TopicRecommendation[] = [
        {
          id: 'rec-1',
          topic: 'Fractions',
          subject: 'math',
          reason: 'Needs practice',
          difficulty: 'medium',
          estimatedMinutes: 10,
        },
        {
          id: 'rec-2',
          topic: 'Multiplication',
          subject: 'math',
          reason: 'Ready to advance',
          difficulty: 'hard',
          estimatedMinutes: 15,
        },
      ];

      service.getRecommendations(studentId).subscribe((data) => {
        expect(data).toEqual(mockRecs);
        expect(data.length).toBe(2);
      });

      const req = httpMock.expectOne(
        `/api/students/${studentId}/recommendations`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockRecs);
    });
  });

  describe('getProgressSummary', () => {
    /**
     * Test: Fetch progress summary (AC8, AC18)
     * Why Essential: Subject cards need mastery data
     * Impact: Subject progress indicators would not display
     */
    it('should retrieve progress summary from GET /api/students/{id}/progress/summary', () => {
      const studentId = 'student-1';
      const mockProgress: SubjectProgress[] = [
        {
          subject: 'math',
          displayName: 'Mathematics',
          icon: '🔢',
          masteryPercentage: 65,
          questionsAnswered: 120,
          lastPracticed: '2026-02-20T14:30:00Z',
        },
      ];

      service.getProgressSummary(studentId).subscribe((data) => {
        expect(data).toEqual(mockProgress);
        expect(data[0].masteryPercentage).toBe(65);
      });

      const req = httpMock.expectOne(
        `/api/students/${studentId}/progress/summary`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockProgress);
    });
  });

  describe('getRecentAchievements', () => {
    /**
     * Test: Fetch recent achievements (AC9)
     * Why Essential: Achievement showcase needs latest badges
     * Impact: Achievement section would be empty
     */
    it('should retrieve recent achievements from GET /api/students/{id}/achievements/recent', () => {
      const studentId = 'student-1';
      const mockAchievements: Achievement[] = [
        {
          id: 'first_steps',
          name: 'First Steps',
          description: 'Answer 10 questions',
          category: 'milestone',
          badgeIcon: 'badge-first-steps',
          pointValue: 10,
          unlocked: true,
          unlockedDate: new Date('2026-01-10'),
          progress: 100,
        },
      ];

      service.getRecentAchievements(studentId).subscribe((data) => {
        expect(data).toEqual(mockAchievements);
        expect(data.length).toBe(1);
      });

      const req = httpMock.expectOne(
        `/api/students/${studentId}/achievements/recent`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockAchievements);
    });
  });

  describe('error handling', () => {
    /**
     * Test: Handle API errors gracefully (AC20)
     * Why Essential: Dashboard must show friendly errors, not crash
     * Impact: Unhandled errors would break the entire dashboard
     */
    it('should propagate HTTP errors from getDashboardData', () => {
      const studentId = 'student-1';

      service.getDashboardData(studentId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(`/api/students/${studentId}/dashboard`);
      req.flush('Server Error', {
        status: 500,
        statusText: 'Internal Server Error',
      });
    });
  });
});
