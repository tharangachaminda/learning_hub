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

import { Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DailyProgress,
  OverallStats,
  WeeklyProgress,
  TopicProgress,
} from '../types/progress-tracking.types';
import {
  ProgressAttempt,
  ProgressAttemptDocument,
} from '../schemas/progress-attempt.schema';

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
    sessionId?: string;
  }>;
  lastPracticeDate?: Date;
  currentStreak: number;
}

interface AttemptRecord {
  questionId: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  isCorrect: boolean;
  timeSpentSeconds: number;
  timestamp: Date;
  sessionId?: string;
}

@Injectable()
export class ProgressTrackingService {
  // Fallback for unit tests that instantiate the service without a model.
  private progressData: Map<string, StudentProgressData> = new Map();

  constructor(
    @Optional()
    @InjectModel(ProgressAttempt.name)
    private readonly progressAttemptModel?: Model<ProgressAttemptDocument>
  ) {}

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
    const attemptedAt = new Date();

    if (this.progressAttemptModel) {
      await this.progressAttemptModel.create({
        studentId,
        questionId: questionData.questionId,
        topic: questionData.topic,
        difficulty: questionData.difficulty,
        isCorrect: questionData.isCorrect,
        timeSpentSeconds: questionData.timeSpentSeconds,
        sessionId: questionData.sessionId,
        attemptedAt,
      });
    } else {
      if (!this.progressData.has(studentId)) {
        this.progressData.set(studentId, {
          attempts: [],
          currentStreak: 0,
        });
      }

      const studentProgress = this.progressData.get(studentId)!;
      studentProgress.attempts.push({
        questionId: questionData.questionId,
        topic: questionData.topic,
        difficulty: questionData.difficulty,
        isCorrect: questionData.isCorrect,
        timeSpentSeconds: questionData.timeSpentSeconds,
        timestamp: attemptedAt,
        sessionId: questionData.sessionId,
      });
      studentProgress.lastPracticeDate = attemptedAt;
    }

    return this.calculateDailyProgress(studentId, attemptedAt);
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
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const todayAttempts = await this.getAttemptsForRange(
      studentId,
      startOfDay,
      endOfDay
    );

    const summary = this.summarizeAttempts(todayAttempts);
    const streakDays = await this.calculateCurrentStreak(studentId, date);

    return {
      studentId,
      date,
      totalQuestionsAttempted: summary.totalQuestionsAttempted,
      correctAnswers: summary.correctAnswers,
      incorrectAnswers: summary.incorrectAnswers,
      accuracyPercentage: summary.accuracyPercentage,
      timeSpentMinutes: summary.timeSpentMinutes,
      topicBreakdown: summary.topicBreakdown,
      streakDays,
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

    const previousWeekEnd = new Date(weekStart);
    previousWeekEnd.setDate(previousWeekEnd.getDate() - 1);
    previousWeekEnd.setHours(23, 59, 59, 999);

    const previousWeekStart = new Date(previousWeekEnd);
    previousWeekStart.setDate(previousWeekStart.getDate() - 6);
    previousWeekStart.setHours(0, 0, 0, 0);

    const previousWeekAttempts = await this.getAttemptsForRange(
      studentId,
      previousWeekStart,
      previousWeekEnd
    );
    const previousWeekSummary = this.summarizeAttempts(previousWeekAttempts);
    const improvementPercentage =
      previousWeekSummary.accuracyPercentage === 0
        ? weeklyAccuracyPercentage > 0
          ? 100
          : 0
        : Math.round(
            ((weeklyAccuracyPercentage -
              previousWeekSummary.accuracyPercentage) /
              previousWeekSummary.accuracyPercentage) *
              10000
          ) / 100;

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
    if (this.progressAttemptModel) {
      const latestAttempt = await this.progressAttemptModel
        .findOne({ studentId })
        .sort({ attemptedAt: -1 })
        .lean()
        .exec();

      const effectiveLastPracticeDate =
        latestAttempt?.attemptedAt ?? lastPracticeDate;
      const daysDifference = Math.floor(
        (currentDate.getTime() - effectiveLastPracticeDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (daysDifference > 1) {
        return 1;
      }

      return this.calculateCurrentStreak(studentId, currentDate);
    }

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

  async getOverallStats(studentId: string): Promise<OverallStats> {
    const attempts = await this.getAllAttempts(studentId);
    const totalQuestionsAllTime = attempts.length;
    const totalCorrectAllTime = attempts.filter(
      (attempt) => attempt.isCorrect
    ).length;
    const overallAccuracyPercentage = this.calculateAccuracyPercentage(
      totalCorrectAllTime,
      totalQuestionsAllTime
    );
    const longestStreak = this.calculateLongestStreak(attempts);
    const currentStreak = await this.calculateCurrentStreak(
      studentId,
      new Date()
    );

    return {
      totalQuestionsAllTime,
      totalCorrectAllTime,
      overallAccuracyPercentage,
      currentStreak,
      longestStreak,
    };
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

  private async getAttemptsForRange(
    studentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AttemptRecord[]> {
    if (this.progressAttemptModel) {
      const attempts = await this.progressAttemptModel
        .find({
          studentId,
          attemptedAt: { $gte: startDate, $lte: endDate },
        })
        .sort({ attemptedAt: 1 })
        .lean()
        .exec();

      return attempts.map((attempt) => ({
        questionId: attempt.questionId,
        topic: attempt.topic,
        difficulty: attempt.difficulty,
        isCorrect: attempt.isCorrect,
        timeSpentSeconds: attempt.timeSpentSeconds,
        timestamp: new Date(attempt.attemptedAt),
        sessionId: attempt.sessionId,
      }));
    }

    const studentProgress = this.progressData.get(studentId);
    if (!studentProgress) {
      return [];
    }

    return studentProgress.attempts.filter(
      (attempt) =>
        attempt.timestamp >= startDate && attempt.timestamp <= endDate
    );
  }

  private async getAllAttempts(studentId: string): Promise<AttemptRecord[]> {
    if (this.progressAttemptModel) {
      const attempts = await this.progressAttemptModel
        .find({ studentId })
        .sort({ attemptedAt: 1 })
        .lean()
        .exec();

      return attempts.map((attempt) => ({
        questionId: attempt.questionId,
        topic: attempt.topic,
        difficulty: attempt.difficulty,
        isCorrect: attempt.isCorrect,
        timeSpentSeconds: attempt.timeSpentSeconds,
        timestamp: new Date(attempt.attemptedAt),
        sessionId: attempt.sessionId,
      }));
    }

    return this.progressData.get(studentId)?.attempts ?? [];
  }

  private summarizeAttempts(attempts: AttemptRecord[]): {
    totalQuestionsAttempted: number;
    correctAnswers: number;
    incorrectAnswers: number;
    accuracyPercentage: number;
    timeSpentMinutes: number;
    topicBreakdown: TopicProgress[];
  } {
    const totalQuestionsAttempted = attempts.length;
    const correctAnswers = attempts.filter(
      (attempt) => attempt.isCorrect
    ).length;
    const incorrectAnswers = totalQuestionsAttempted - correctAnswers;
    const accuracyPercentage = this.calculateAccuracyPercentage(
      correctAnswers,
      totalQuestionsAttempted
    );
    const timeSpentMinutes = Math.round(
      attempts.reduce((sum, attempt) => sum + attempt.timeSpentSeconds, 0) / 60
    );

    return {
      totalQuestionsAttempted,
      correctAnswers,
      incorrectAnswers,
      accuracyPercentage,
      timeSpentMinutes,
      topicBreakdown: this.calculateTopicBreakdown(attempts),
    };
  }

  private async calculateCurrentStreak(
    studentId: string,
    referenceDate: Date
  ): Promise<number> {
    const attempts = await this.getAllAttempts(studentId);
    if (attempts.length === 0) {
      return 0;
    }

    const referenceEnd = new Date(referenceDate);
    referenceEnd.setHours(23, 59, 59, 999);

    const dayKeys = Array.from(
      new Set(
        attempts
          .filter((attempt) => attempt.timestamp <= referenceEnd)
          .map((attempt) => this.toDayKey(attempt.timestamp))
      )
    ).sort();

    if (dayKeys.length === 0) {
      return 0;
    }

    const latestDay = new Date(dayKeys[dayKeys.length - 1]);
    const referenceDay = new Date(referenceDate);
    referenceDay.setHours(0, 0, 0, 0);

    const gapFromReference = Math.floor(
      (referenceDay.getTime() - latestDay.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (gapFromReference > 1) {
      return 0;
    }

    let streak = 0;
    let cursor = latestDay;

    for (let index = dayKeys.length - 1; index >= 0; index -= 1) {
      const day = new Date(dayKeys[index]);
      if (day.getTime() !== cursor.getTime()) {
        break;
      }
      streak += 1;
      cursor = new Date(cursor);
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  }

  private calculateLongestStreak(attempts: AttemptRecord[]): number {
    const dayKeys = Array.from(
      new Set(attempts.map((attempt) => this.toDayKey(attempt.timestamp)))
    ).sort();

    if (dayKeys.length === 0) {
      return 0;
    }

    let longest = 1;
    let current = 1;

    for (let index = 1; index < dayKeys.length; index += 1) {
      const previousDay = new Date(dayKeys[index - 1]);
      const currentDay = new Date(dayKeys[index]);
      const difference = Math.floor(
        (currentDay.getTime() - previousDay.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (difference === 1) {
        current += 1;
        longest = Math.max(longest, current);
      } else if (difference > 1) {
        current = 1;
      }
    }

    return longest;
  }

  private toDayKey(date: Date): string {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized.toISOString();
  }
}
