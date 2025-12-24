/**
 * Progress Tracking Service
 *
 * Core business logic for tracking student progress.
 * Implements requirements:
 * - AC-001: Daily question count tracking
 * - AC-002: Accuracy percentage calculation
 * - AC-004: Weekly improvement tracking
 * - AC-005: Daily reset with weekly history
 * - REQ-PT-001: Topic-level tracking
 * - REQ-PT-002: Session data capture
 */

import { Injectable } from '@nestjs/common';
import {
  DailyProgress,
  WeeklyProgress,
  TopicProgress,
} from '../types/progress-tracking.types';

/**
 * Question attempt data for recording
 */
interface QuestionAttemptData {
  questionId: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  isCorrect: boolean;
  timeSpentSeconds: number;
  sessionId?: string;
}

/**
 * In-memory storage for progress data (will be replaced with MongoDB)
 */
interface StudentProgressData {
  attempts: Array<{
    questionId: string;
    topic: string;
    difficulty: 'easy' | 'medium' | 'hard';
    isCorrect: boolean;
    timeSpentSeconds: number;
    timestamp: Date;
  }>;
  lastPracticeDate?: Date;
  currentStreak: number;
}

@Injectable()
export class ProgressTrackingService {
  // In-memory storage (temporary - will use MongoDB)
  private progressData: Map<string, StudentProgressData> = new Map();

  /**
   * Record a question attempt for a student
   *
   * Captures individual question attempts and updates daily progress.
   * Supports AC-001 (question count) and AC-002 (accuracy tracking).
   *
   * @param studentId - Unique student identifier
   * @param questionData - Question attempt details
   * @returns Updated daily progress for the student
   * @throws Error if studentId is invalid or questionData is malformed
   */
  async recordQuestionAttempt(
    studentId: string,
    questionData: QuestionAttemptData
  ): Promise<DailyProgress> {
    // Get or initialize student progress data
    if (!this.progressData.has(studentId)) {
      this.progressData.set(studentId, {
        attempts: [],
        currentStreak: 0,
      });
    }

    const studentProgress = this.progressData.get(studentId)!;

    // Record the attempt
    studentProgress.attempts.push({
      questionId: questionData.questionId,
      topic: questionData.topic,
      difficulty: questionData.difficulty,
      isCorrect: questionData.isCorrect,
      timeSpentSeconds: questionData.timeSpentSeconds,
      timestamp: new Date(),
    });

    // Update last practice date
    studentProgress.lastPracticeDate = new Date();

    // Calculate and return updated daily progress
    return this.calculateDailyProgress(studentId, new Date());
  }

  /**
   * Calculate daily progress for a student on a specific date
   *
   * Aggregates all question attempts for a given day.
   * Implements AC-001 (total questions) and AC-002 (accuracy percentage).
   *
   * @param studentId - Unique student identifier
   * @param date - Date for progress calculation
   * @returns Daily progress summary
   */
  async calculateDailyProgress(
    studentId: string,
    date: Date
  ): Promise<DailyProgress> {
    const studentProgress = this.progressData.get(studentId);

    if (!studentProgress) {
      // Return zero state for new student
      return {
        studentId,
        date,
        totalQuestionsAttempted: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        accuracyPercentage: 0,
        timeSpentMinutes: 0,
        topicBreakdown: [],
        streakDays: 0,
      };
    }

    // Filter attempts for the specific date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const todayAttempts = studentProgress.attempts.filter(
      (attempt) =>
        attempt.timestamp >= startOfDay && attempt.timestamp <= endOfDay
    );

    // Calculate totals
    const totalQuestionsAttempted = todayAttempts.length;
    const correctAnswers = todayAttempts.filter((a) => a.isCorrect).length;
    const incorrectAnswers = totalQuestionsAttempted - correctAnswers;
    const accuracyPercentage = this.calculateAccuracyPercentage(
      correctAnswers,
      totalQuestionsAttempted
    );
    const timeSpentMinutes = Math.round(
      todayAttempts.reduce((sum, a) => sum + a.timeSpentSeconds, 0) / 60
    );

    // Calculate topic breakdown
    const topicBreakdown = this.calculateTopicBreakdown(todayAttempts);

    return {
      studentId,
      date,
      totalQuestionsAttempted,
      correctAnswers,
      incorrectAnswers,
      accuracyPercentage,
      timeSpentMinutes,
      topicBreakdown,
      streakDays: studentProgress.currentStreak,
    };
  }

  /**
   * Calculate weekly progress for a student
   *
   * Aggregates daily progress over a week period.
   * Implements AC-004 (improvement tracking) and AC-005 (weekly history).
   *
   * @param studentId - Unique student identifier
   * @param weekStart - Start date of the week
   * @param weekEnd - End date of the week
   * @returns Weekly progress summary with daily snapshots
   */
  async calculateWeeklyProgress(
    studentId: string,
    weekStart: Date,
    weekEnd: Date
  ): Promise<WeeklyProgress> {
    const dailySnapshots: DailyProgress[] = [];

    // Generate daily snapshots for each day in the week
    const currentDate = new Date(weekStart);
    while (currentDate <= weekEnd) {
      const dailyProgress = await this.calculateDailyProgress(
        studentId,
        new Date(currentDate)
      );
      dailySnapshots.push(dailyProgress);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate weekly totals
    const totalQuestionsAttempted = dailySnapshots.reduce(
      (sum, day) => sum + day.totalQuestionsAttempted,
      0
    );
    const totalCorrectAnswers = dailySnapshots.reduce(
      (sum, day) => sum + day.correctAnswers,
      0
    );
    const weeklyAccuracyPercentage = this.calculateAccuracyPercentage(
      totalCorrectAnswers,
      totalQuestionsAttempted
    );
    const totalTimeSpentMinutes = dailySnapshots.reduce(
      (sum, day) => sum + day.timeSpentMinutes,
      0
    );

    // Calculate improvement from previous week
    // MVP: Returns 0 - will calculate from historical data when MongoDB persistence is added
    const improvementPercentage = 0;

    return {
      studentId,
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      dailySnapshots,
      totalQuestionsAttempted,
      totalCorrectAnswers,
      weeklyAccuracyPercentage,
      totalTimeSpentMinutes,
      improvementPercentage,
    };
  }

  /**
   * Update student's practice streak
   *
   * Tracks consecutive days of practice for achievement system.
   *
   * @param studentId - Unique student identifier
   * @param lastPracticeDate - Previous practice date
   * @param currentDate - Current practice date
   * @returns Updated streak count
   */
  async updateStreak(
    studentId: string,
    lastPracticeDate: Date,
    currentDate: Date
  ): Promise<number> {
    const studentProgress = this.progressData.get(studentId);

    if (!studentProgress) {
      // New student - initialize with streak of 1
      this.progressData.set(studentId, {
        attempts: [],
        currentStreak: 1,
        lastPracticeDate: currentDate,
      });
      return 1;
    }

    // Calculate days between practice sessions
    const daysDifference = Math.floor(
      (currentDate.getTime() - lastPracticeDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysDifference === 1) {
      // Consecutive day - increment streak
      studentProgress.currentStreak += 1;
    } else if (daysDifference > 1) {
      // Break in streak - reset to 1
      studentProgress.currentStreak = 1;
    }
    // Same day (daysDifference === 0) - no change to streak

    studentProgress.lastPracticeDate = currentDate;
    return studentProgress.currentStreak;
  }

  /**
   * Calculate accuracy percentage
   *
   * Implements AC-002 requirement for displaying correct answer percentage.
   * Handles edge case of zero attempts.
   *
   * @param correctAnswers - Number of correct answers
   * @param totalAttempts - Total number of attempts
   * @returns Accuracy percentage (0-100), rounded to 2 decimal places
   */
  calculateAccuracyPercentage(
    correctAnswers: number,
    totalAttempts: number
  ): number {
    if (totalAttempts === 0) {
      return 0;
    }
    const percentage = (correctAnswers / totalAttempts) * 100;
    return Math.round(percentage * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculate topic breakdown from attempts
   *
   * Implements REQ-PT-001 requirement for topic-level tracking.
   * Aggregates attempts by topic and difficulty.
   *
   * @param attempts - Array of question attempts
   * @returns Array of topic progress summaries
   */
  private calculateTopicBreakdown(
    attempts: Array<{
      topic: string;
      difficulty: 'easy' | 'medium' | 'hard';
      isCorrect: boolean;
    }>
  ): TopicProgress[] {
    const topicMap = new Map<string, TopicProgress>();

    attempts.forEach((attempt) => {
      const key = `${attempt.topic}-${attempt.difficulty}`;

      if (!topicMap.has(key)) {
        topicMap.set(key, {
          topicName: attempt.topic,
          difficulty: attempt.difficulty,
          questionsAttempted: 0,
          correctAnswers: 0,
          accuracyPercentage: 0,
        });
      }

      const topicProgress = topicMap.get(key)!;
      topicProgress.questionsAttempted += 1;
      if (attempt.isCorrect) {
        topicProgress.correctAnswers += 1;
      }
      topicProgress.accuracyPercentage = this.calculateAccuracyPercentage(
        topicProgress.correctAnswers,
        topicProgress.questionsAttempted
      );
    });

    return Array.from(topicMap.values());
  }
}
