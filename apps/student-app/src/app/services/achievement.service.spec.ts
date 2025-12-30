/**
 * Achievement Service - Unit Tests
 *
 * Test Strategy: Validate API integration and data processing
 * - AC-003: Next milestone progress
 * - AC-004: Get all achievements
 * - AC-006: Category filtering
 */

import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AchievementService } from './achievement.service';
import { Achievement, StudentAchievements } from '../models/achievement.model';

describe('AchievementService', () => {
  let service: AchievementService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AchievementService],
    });

    service = TestBed.inject(AchievementService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Ensure no outstanding HTTP requests
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getStudentAchievements', () => {
    /**
     * Test: Fetch all student achievements (AC-004)
     * Why Essential: Badge gallery needs all achievement data
     * Impact: Gallery cannot display achievements without this
     */
    it('should retrieve student achievements from API', () => {
      const studentId = 'student-123';
      const mockResponse: StudentAchievements = {
        studentId: 'student-123',
        achievements: [
          {
            id: 'first_steps',
            name: 'First Steps',
            description: 'Answer 10 questions correctly',
            category: 'milestone',
            badgeIcon: 'badge-first-steps',
            pointValue: 10,
            unlocked: true,
            unlockedDate: new Date('2024-12-26'),
            progress: 100,
          },
          {
            id: 'math_star',
            name: 'Math Star',
            description: 'Answer 25 questions correctly',
            category: 'milestone',
            badgeIcon: 'badge-math-star',
            pointValue: 25,
            unlocked: false,
            progress: 50,
          },
        ],
        totalPoints: 10,
        recentlyUnlocked: [],
      };

      service.getStudentAchievements(studentId).subscribe((data) => {
        expect(data).toEqual(mockResponse);
        expect(data.achievements.length).toBe(2);
        expect(data.totalPoints).toBe(10);
      });

      const req = httpMock.expectOne(`/api/progress/achievements/${studentId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getNextMilestone', () => {
    /**
     * Test: Fetch next milestone progress (AC-003)
     * Why Essential: Show students progress towards next achievement
     * Impact: Reduced motivation without visible progress
     */
    it('should retrieve next milestone information', () => {
      const studentId = 'student-123';
      const mockResponse = {
        studentId: 'student-123',
        nextMilestone: {
          id: 'math_star',
          name: 'Math Star',
          description: 'Answer 25 questions correctly',
          threshold: 25,
        },
        currentCorrectAnswers: 15,
        progressPercentage: 60,
        questionsRemaining: 10,
      };

      service.getNextMilestone(studentId).subscribe((data) => {
        expect(data.progressPercentage).toBe(60);
        expect(data.questionsRemaining).toBe(10);
      });

      const req = httpMock.expectOne(
        `/api/progress/achievements/${studentId}/next`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('checkForNewAchievements', () => {
    /**
     * Test: Detect newly unlocked achievements (AC-003)
     * Why Essential: Trigger celebration animations
     * Impact: Students miss achievement unlock notifications
     */
    it('should emit newly unlocked achievements', (done) => {
      const studentId = 'student-123';
      const mockAchievement: Achievement = {
        id: 'first_steps',
        name: 'First Steps',
        description: 'Answer 10 questions correctly',
        category: 'milestone',
        badgeIcon: 'badge-first-steps',
        pointValue: 10,
        unlocked: true,
        unlockedDate: new Date(),
        progress: 100,
      };

      const mockResponse: StudentAchievements = {
        studentId: 'student-123',
        achievements: [mockAchievement],
        totalPoints: 10,
        recentlyUnlocked: [mockAchievement],
      };

      // Subscribe to newly unlocked observable
      service.newlyUnlocked$.subscribe((unlocked) => {
        if (unlocked.length > 0) {
          expect(unlocked.length).toBe(1);
          expect(unlocked[0].id).toBe('first_steps');
          done();
        }
      });

      service.checkForNewAchievements(studentId).subscribe();

      const req = httpMock.expectOne(`/api/progress/achievements/${studentId}`);
      req.flush(mockResponse);
    });
  });

  describe('getAchievementsByCategory', () => {
    /**
     * Test: Filter achievements by category (AC-006)
     * Why Essential: Organize badge gallery by type
     * Impact: Disorganized achievement display
     */
    it('should filter achievements by category', () => {
      const achievements: Achievement[] = [
        {
          id: 'first_steps',
          name: 'First Steps',
          description: 'Milestone',
          category: 'milestone',
          badgeIcon: 'badge-first-steps',
          pointValue: 10,
          unlocked: true,
          progress: 100,
        },
        {
          id: 'streak_starter',
          name: 'Streak Starter',
          description: '3 day streak',
          category: 'streak',
          badgeIcon: 'badge-streak',
          pointValue: 15,
          unlocked: false,
          progress: 50,
        },
        {
          id: 'addition_master',
          name: 'Addition Master',
          description: 'Master addition',
          category: 'topic_mastery',
          badgeIcon: 'badge-addition',
          pointValue: 40,
          unlocked: true,
          progress: 100,
        },
      ];

      const milestones = service.getAchievementsByCategory(
        achievements,
        'milestone'
      );
      expect(milestones.length).toBe(1);
      expect(milestones[0].id).toBe('first_steps');

      const topicAchievements = service.getAchievementsByCategory(
        achievements,
        'topic_mastery'
      );
      expect(topicAchievements.length).toBe(1);
      expect(topicAchievements[0].id).toBe('addition_master');
    });
  });

  describe('getCompletionPercentage', () => {
    /**
     * Test: Calculate overall achievement completion
     * Why Essential: Show progress overview in gallery
     * Impact: Cannot display completion stats
     */
    it('should calculate percentage of unlocked achievements', () => {
      const achievements: Achievement[] = [
        {
          id: '1',
          name: 'A',
          description: '',
          category: 'milestone',
          badgeIcon: '',
          pointValue: 10,
          unlocked: true,
          progress: 100,
        },
        {
          id: '2',
          name: 'B',
          description: '',
          category: 'milestone',
          badgeIcon: '',
          pointValue: 10,
          unlocked: true,
          progress: 100,
        },
        {
          id: '3',
          name: 'C',
          description: '',
          category: 'milestone',
          badgeIcon: '',
          pointValue: 10,
          unlocked: false,
          progress: 50,
        },
        {
          id: '4',
          name: 'D',
          description: '',
          category: 'milestone',
          badgeIcon: '',
          pointValue: 10,
          unlocked: false,
          progress: 0,
        },
      ];

      const percentage = service.getCompletionPercentage(achievements);
      expect(percentage).toBe(50); // 2 out of 4 = 50%
    });

    it('should return 0 for empty achievement list', () => {
      const percentage = service.getCompletionPercentage([]);
      expect(percentage).toBe(0);
    });
  });
});
