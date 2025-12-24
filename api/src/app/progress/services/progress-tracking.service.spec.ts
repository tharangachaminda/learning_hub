/**
 * Progress Tracking Service - Unit Tests
 *
 * Test Strategy: Validate core business logic for progress tracking
 * - AC-001: Daily question count calculation
 * - AC-002: Accuracy percentage calculation
 * - AC-004: Weekly improvement tracking
 * - AC-005: Daily reset with weekly history
 * - REQ-PT-001: Topic-level tracking
 * - REQ-PT-002: Session data capture
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ProgressTrackingService } from './progress-tracking.service';
import {
  DailyProgress,
  WeeklyProgress,
  TopicProgress,
} from '../types/progress-tracking.types';

describe('ProgressTrackingService', () => {
  let service: ProgressTrackingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProgressTrackingService],
    }).compile();

    service = module.get<ProgressTrackingService>(ProgressTrackingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordQuestionAttempt', () => {
    /**
     * Test: Record a single question attempt
     * Why Essential: Foundation for all progress tracking (AC-001, AC-002)
     * Impact: Without this, no progress data can be captured
     */
    it('should record a correct answer and update progress', async () => {
      const studentId = 'student-123';
      const questionData = {
        questionId: 'q-1',
        topic: 'Addition',
        difficulty: 'easy' as const,
        isCorrect: true,
        timeSpentSeconds: 45,
      };

      const result = await service.recordQuestionAttempt(
        studentId,
        questionData
      );

      expect(result).toBeDefined();
      expect(result.totalQuestionsAttempted).toBe(1);
      expect(result.correctAnswers).toBe(1);
      expect(result.accuracyPercentage).toBe(100);
    });

    /**
     * Test: Record an incorrect answer
     * Why Essential: Accuracy calculation requires both correct and incorrect tracking
     * Impact: Cannot calculate accurate percentages without tracking failures
     */
    it('should record an incorrect answer and update accuracy', async () => {
      const studentId = 'student-123';
      const questionData = {
        questionId: 'q-2',
        topic: 'Subtraction',
        difficulty: 'medium' as const,
        isCorrect: false,
        timeSpentSeconds: 60,
      };

      const result = await service.recordQuestionAttempt(
        studentId,
        questionData
      );

      expect(result).toBeDefined();
      expect(result.totalQuestionsAttempted).toBeGreaterThan(0);
      expect(result.incorrectAnswers).toBeGreaterThan(0);
      expect(result.accuracyPercentage).toBeLessThan(100);
    });

    /**
     * Test: Multiple question attempts update cumulative progress
     * Why Essential: Progress must accumulate throughout the day (AC-001)
     * Impact: Daily totals would be incorrect without proper accumulation
     */
    it('should accumulate multiple question attempts', async () => {
      const studentId = 'student-123';

      await service.recordQuestionAttempt(studentId, {
        questionId: 'q-1',
        topic: 'Addition',
        difficulty: 'easy' as const,
        isCorrect: true,
        timeSpentSeconds: 30,
      });

      await service.recordQuestionAttempt(studentId, {
        questionId: 'q-2',
        topic: 'Addition',
        difficulty: 'easy' as const,
        isCorrect: true,
        timeSpentSeconds: 35,
      });

      const result = await service.recordQuestionAttempt(studentId, {
        questionId: 'q-3',
        topic: 'Addition',
        difficulty: 'easy' as const,
        isCorrect: false,
        timeSpentSeconds: 40,
      });

      expect(result.totalQuestionsAttempted).toBe(3);
      expect(result.correctAnswers).toBe(2);
      expect(result.incorrectAnswers).toBe(1);
      expect(result.accuracyPercentage).toBeCloseTo(66.67, 1);
    });
  });

  describe('calculateDailyProgress', () => {
    /**
     * Test: Calculate daily progress with multiple attempts (AC-001, AC-002)
     * Why Essential: Core requirement - show today's question count and accuracy
     * Impact: Dashboard cannot display daily stats without this
     */
    it('should calculate daily progress correctly', async () => {
      const studentId = 'student-456';
      const today = new Date();

      // Record some attempts
      await service.recordQuestionAttempt(studentId, {
        questionId: 'q-1',
        topic: 'Addition',
        difficulty: 'easy' as const,
        isCorrect: true,
        timeSpentSeconds: 30,
      });

      await service.recordQuestionAttempt(studentId, {
        questionId: 'q-2',
        topic: 'Subtraction',
        difficulty: 'medium' as const,
        isCorrect: false,
        timeSpentSeconds: 45,
      });

      const dailyProgress = await service.calculateDailyProgress(
        studentId,
        today
      );

      expect(dailyProgress).toBeDefined();
      expect(dailyProgress.studentId).toBe(studentId);
      expect(dailyProgress.totalQuestionsAttempted).toBe(2);
      expect(dailyProgress.correctAnswers).toBe(1);
      expect(dailyProgress.incorrectAnswers).toBe(1);
      expect(dailyProgress.accuracyPercentage).toBe(50);
    });

    /**
     * Test: Topic breakdown aggregation (REQ-PT-001)
     * Why Essential: Track individual progress across topics
     * Impact: Cannot identify strength/weakness areas without topic-level data
     */
    it('should aggregate progress by topic and difficulty', async () => {
      const studentId = 'student-789';
      const today = new Date();

      // Multiple attempts in different topics
      await service.recordQuestionAttempt(studentId, {
        questionId: 'q-1',
        topic: 'Addition',
        difficulty: 'easy' as const,
        isCorrect: true,
        timeSpentSeconds: 30,
      });

      await service.recordQuestionAttempt(studentId, {
        questionId: 'q-2',
        topic: 'Addition',
        difficulty: 'easy' as const,
        isCorrect: true,
        timeSpentSeconds: 25,
      });

      await service.recordQuestionAttempt(studentId, {
        questionId: 'q-3',
        topic: 'Subtraction',
        difficulty: 'medium' as const,
        isCorrect: false,
        timeSpentSeconds: 60,
      });

      const dailyProgress = await service.calculateDailyProgress(
        studentId,
        today
      );

      expect(dailyProgress.topicBreakdown).toBeDefined();
      expect(dailyProgress.topicBreakdown.length).toBeGreaterThan(0);

      const additionTopic = dailyProgress.topicBreakdown.find(
        (t) => t.topicName === 'Addition' && t.difficulty === 'easy'
      );
      expect(additionTopic).toBeDefined();
      expect(additionTopic?.questionsAttempted).toBe(2);
      expect(additionTopic?.correctAnswers).toBe(2);
      expect(additionTopic?.accuracyPercentage).toBe(100);
    });

    /**
     * Test: Handle no data for today (edge case)
     * Why Essential: First-time users or days with no activity
     * Impact: Application crashes without proper zero-state handling
     */
    it('should return zero progress when no attempts today', async () => {
      const studentId = 'student-new';
      const today = new Date();

      const dailyProgress = await service.calculateDailyProgress(
        studentId,
        today
      );

      expect(dailyProgress).toBeDefined();
      expect(dailyProgress.totalQuestionsAttempted).toBe(0);
      expect(dailyProgress.correctAnswers).toBe(0);
      expect(dailyProgress.accuracyPercentage).toBe(0);
      expect(dailyProgress.topicBreakdown).toEqual([]);
    });
  });

  describe('calculateWeeklyProgress', () => {
    /**
     * Test: Weekly progress aggregation (AC-004, AC-005)
     * Why Essential: Show improvement over last week with daily history
     * Impact: Cannot display weekly trends without this
     */
    it('should calculate weekly progress with daily snapshots', async () => {
      const studentId = 'student-weekly';

      // Use current date for the week to ensure attempts are captured
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 6); // Start of week (7 days ago)
      const weekEnd = new Date(today);

      // Record some attempts today
      await service.recordQuestionAttempt(studentId, {
        questionId: 'q-1',
        topic: 'Addition',
        difficulty: 'easy' as const,
        isCorrect: true,
        timeSpentSeconds: 30,
      });

      await service.recordQuestionAttempt(studentId, {
        questionId: 'q-2',
        topic: 'Subtraction',
        difficulty: 'medium' as const,
        isCorrect: false,
        timeSpentSeconds: 45,
      });

      const weeklyProgress = await service.calculateWeeklyProgress(
        studentId,
        weekStart,
        weekEnd
      );

      expect(weeklyProgress).toBeDefined();
      expect(weeklyProgress.studentId).toBe(studentId);
      expect(weeklyProgress.dailySnapshots).toBeDefined();
      expect(weeklyProgress.dailySnapshots).toBeInstanceOf(Array);
      expect(weeklyProgress.dailySnapshots.length).toBe(7); // 7 days in the week
      expect(weeklyProgress.totalQuestionsAttempted).toBe(2);
      expect(weeklyProgress.totalCorrectAnswers).toBe(1);
      expect(weeklyProgress.weeklyAccuracyPercentage).toBe(50);
    });

    /**
     * Test: Calculate improvement percentage (AC-004)
     * Why Essential: Students need to see their week-over-week improvement
     * Impact: Motivational feature missing without improvement tracking
     */
    it('should calculate improvement percentage from previous week', async () => {
      const studentId = 'student-improve';
      const currentWeekStart = new Date('2024-12-18');
      const currentWeekEnd = new Date('2024-12-24');

      const weeklyProgress = await service.calculateWeeklyProgress(
        studentId,
        currentWeekStart,
        currentWeekEnd
      );

      expect(weeklyProgress.improvementPercentage).toBeDefined();
      expect(typeof weeklyProgress.improvementPercentage).toBe('number');
    });
  });

  describe('updateStreak', () => {
    /**
     * Test: Increment streak for consecutive days
     * Why Essential: Streak tracking for achievements and motivation
     * Impact: Achievement system cannot function without streak data
     */
    it('should increment streak when practicing on consecutive days', async () => {
      const studentId = 'student-streak';

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const today = new Date();

      const streak = await service.updateStreak(studentId, yesterday, today);

      expect(streak).toBeGreaterThan(0);
    });

    /**
     * Test: Reset streak when days are not consecutive
     * Why Essential: Accurate streak tracking requires detecting breaks
     * Impact: Inflated streak counts without proper reset logic
     */
    it('should reset streak when days are not consecutive', async () => {
      const studentId = 'student-break';

      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const today = new Date();

      const streak = await service.updateStreak(studentId, threeDaysAgo, today);

      expect(streak).toBe(1); // Reset to 1 for today
    });
  });

  describe('calculateAccuracyPercentage', () => {
    /**
     * Test: Accuracy calculation (AC-002)
     * Why Essential: Core metric for progress tracking
     * Impact: Cannot show "75% correct" without accurate calculation
     */
    it('should calculate accuracy percentage correctly', () => {
      const accuracy = service.calculateAccuracyPercentage(6, 8);
      expect(accuracy).toBe(75);
    });

    /**
     * Test: Handle zero division edge case
     * Why Essential: Prevent crashes when no questions attempted
     * Impact: Application error on first load
     */
    it('should return 0 when no questions attempted', () => {
      const accuracy = service.calculateAccuracyPercentage(0, 0);
      expect(accuracy).toBe(0);
    });

    /**
     * Test: Round to 2 decimal places
     * Why Essential: Clean display of percentages
     * Impact: Ugly decimals in UI without rounding
     */
    it('should round to 2 decimal places', () => {
      const accuracy = service.calculateAccuracyPercentage(2, 3);
      expect(accuracy).toBeCloseTo(66.67, 2);
    });
  });
});
