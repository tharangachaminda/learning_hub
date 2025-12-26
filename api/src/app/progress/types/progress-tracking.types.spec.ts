/**
 * Progress Tracking Types - Interface Contract Tests
 *
 * Test Strategy: Validate type definitions support all acceptance criteria
 * - AC-001: Daily question count tracking
 * - AC-002: Correct answers count and percentage
 * - AC-004: Weekly improvement tracking
 * - AC-005: Daily reset with weekly history
 * - REQ-PT-001: Track by topic and difficulty
 * - REQ-PT-002: Session data (time, attempts, accuracy)
 */

import {
  DailyProgress,
  WeeklyProgress,
  ProgressSummary,
  TopicProgress,
  SessionData,
} from './progress-tracking.types';

describe('Progress Tracking Type Definitions', () => {
  describe('DailyProgress Interface', () => {
    /**
     * Test: Daily progress supports AC-001 (total questions answered today)
     * Why Essential: Core requirement for displaying today's activity
     * Impact: Without this, students cannot see daily question count
     */
    it('should have properties for total questions answered today', () => {
      const dailyProgress: DailyProgress = {
        studentId: 'student-123',
        date: new Date('2024-12-24'),
        totalQuestionsAttempted: 8,
        correctAnswers: 6,
        incorrectAnswers: 2,
        accuracyPercentage: 75,
        timeSpentMinutes: 45,
        topicBreakdown: [],
        streakDays: 3,
      };

      expect(dailyProgress.totalQuestionsAttempted).toBe(8);
      expect(dailyProgress.date).toBeInstanceOf(Date);
    });

    /**
     * Test: Daily progress calculates accuracy percentage (AC-002)
     * Why Essential: Students need to see their performance percentage
     * Impact: Cannot display "75% correct" without this calculation
     */
    it('should calculate and store accuracy percentage', () => {
      const dailyProgress: DailyProgress = {
        studentId: 'student-123',
        date: new Date('2024-12-24'),
        totalQuestionsAttempted: 8,
        correctAnswers: 6,
        incorrectAnswers: 2,
        accuracyPercentage: 75,
        timeSpentMinutes: 45,
        topicBreakdown: [],
        streakDays: 3,
      };

      expect(dailyProgress.correctAnswers).toBe(6);
      expect(dailyProgress.accuracyPercentage).toBe(75);
    });

    /**
     * Test: Daily progress tracks topic-level breakdown (REQ-PT-001)
     * Why Essential: Need granular tracking across topics and difficulty
     * Impact: Cannot identify strength/weakness areas without topic breakdown
     */
    it('should include topic and difficulty level breakdown', () => {
      const topicProgress: TopicProgress = {
        topicName: 'Addition',
        difficulty: 'easy',
        questionsAttempted: 5,
        correctAnswers: 4,
        accuracyPercentage: 80,
      };

      const dailyProgress: DailyProgress = {
        studentId: 'student-123',
        date: new Date('2024-12-24'),
        totalQuestionsAttempted: 8,
        correctAnswers: 6,
        incorrectAnswers: 2,
        accuracyPercentage: 75,
        timeSpentMinutes: 45,
        topicBreakdown: [topicProgress],
        streakDays: 3,
      };

      expect(dailyProgress.topicBreakdown).toHaveLength(1);
      expect(dailyProgress.topicBreakdown[0].topicName).toBe('Addition');
    });
  });

  describe('WeeklyProgress Interface', () => {
    /**
     * Test: Weekly progress maintains daily history (AC-005)
     * Why Essential: Progress resets daily but maintains weekly history
     * Impact: Cannot show weekly trends without historical daily data
     */
    it('should maintain array of daily progress snapshots', () => {
      const weeklyProgress: WeeklyProgress = {
        studentId: 'student-123',
        weekStartDate: new Date('2024-12-18'),
        weekEndDate: new Date('2024-12-24'),
        dailySnapshots: [
          {
            studentId: 'student-123',
            date: new Date('2024-12-24'),
            totalQuestionsAttempted: 8,
            correctAnswers: 6,
            incorrectAnswers: 2,
            accuracyPercentage: 75,
            timeSpentMinutes: 45,
            topicBreakdown: [],
            streakDays: 3,
          },
        ],
        totalQuestionsAttempted: 8,
        totalCorrectAnswers: 6,
        weeklyAccuracyPercentage: 75,
        totalTimeSpentMinutes: 45,
        improvementPercentage: 0,
      };

      expect(weeklyProgress.dailySnapshots).toBeDefined();
      expect(weeklyProgress.dailySnapshots).toBeInstanceOf(Array);
    });

    /**
     * Test: Weekly progress calculates improvement trend (AC-004)
     * Why Essential: Students need to see improvement over last week
     * Impact: Cannot display "You improved by 15% this week!" without this
     */
    it('should calculate improvement percentage from previous week', () => {
      const weeklyProgress: WeeklyProgress = {
        studentId: 'student-123',
        weekStartDate: new Date('2024-12-18'),
        weekEndDate: new Date('2024-12-24'),
        dailySnapshots: [],
        totalQuestionsAttempted: 40,
        totalCorrectAnswers: 32,
        weeklyAccuracyPercentage: 80,
        totalTimeSpentMinutes: 200,
        improvementPercentage: 15, // 15% improvement from last week
      };

      expect(weeklyProgress.improvementPercentage).toBeDefined();
      expect(typeof weeklyProgress.improvementPercentage).toBe('number');
    });
  });

  describe('SessionData Interface', () => {
    /**
     * Test: Session data captures time spent and accuracy (REQ-PT-002)
     * Why Essential: Store session data including time, attempts, accuracy
     * Impact: Cannot track individual session performance without this
     */
    it('should track session-level metrics', () => {
      const sessionData: SessionData = {
        sessionId: 'session-abc',
        studentId: 'student-123',
        startTime: new Date('2024-12-24T10:00:00'),
        endTime: new Date('2024-12-24T10:30:00'),
        durationMinutes: 30,
        questionsAttempted: 5,
        correctAnswers: 4,
        accuracyPercentage: 80,
        topicsStudied: ['Addition', 'Subtraction'],
      };

      expect(sessionData.durationMinutes).toBe(30);
      expect(sessionData.questionsAttempted).toBe(5);
      expect(sessionData.accuracyPercentage).toBe(80);
    });
  });

  describe('ProgressSummary Interface', () => {
    /**
     * Test: Progress summary aggregates all relevant metrics
     * Why Essential: Provides complete view for progress dashboard
     * Impact: Dashboard cannot render without comprehensive summary
     */
    it('should aggregate daily, weekly, and overall progress', () => {
      const summary: ProgressSummary = {
        studentId: 'student-123',
        currentDate: new Date('2024-12-24'),
        dailyProgress: {
          studentId: 'student-123',
          date: new Date('2024-12-24'),
          totalQuestionsAttempted: 8,
          correctAnswers: 6,
          incorrectAnswers: 2,
          accuracyPercentage: 75,
          timeSpentMinutes: 45,
          topicBreakdown: [],
          streakDays: 3,
        },
        weeklyProgress: {
          studentId: 'student-123',
          weekStartDate: new Date('2024-12-18'),
          weekEndDate: new Date('2024-12-24'),
          dailySnapshots: [],
          totalQuestionsAttempted: 40,
          totalCorrectAnswers: 32,
          weeklyAccuracyPercentage: 80,
          totalTimeSpentMinutes: 200,
          improvementPercentage: 15,
        },
        overallStats: {
          totalQuestionsAllTime: 150,
          totalCorrectAllTime: 120,
          overallAccuracyPercentage: 80,
          currentStreak: 3,
          longestStreak: 5,
        },
      };

      expect(summary.dailyProgress).toBeDefined();
      expect(summary.weeklyProgress).toBeDefined();
      expect(summary.overallStats).toBeDefined();
    });
  });

  describe('TopicProgress Interface', () => {
    /**
     * Test: Topic progress tracks difficulty levels (REQ-PT-001)
     * Why Essential: Individual tracking across topics and difficulty levels
     * Impact: Cannot provide targeted practice recommendations without this
     */
    it('should track progress per topic and difficulty combination', () => {
      const topicProgress: TopicProgress = {
        topicName: 'Multiplication',
        difficulty: 'medium',
        questionsAttempted: 10,
        correctAnswers: 7,
        accuracyPercentage: 70,
      };

      expect(topicProgress.topicName).toBe('Multiplication');
      expect(topicProgress.difficulty).toBe('medium');
      expect(topicProgress.accuracyPercentage).toBe(70);
    });
  });
});
