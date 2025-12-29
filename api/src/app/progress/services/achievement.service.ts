/**
 * Achievement Service
 *
 * Manages student achievements and milestone detection.
 * Implements AC-006: Achievements unlock at milestones (10, 25, 50 correct answers)
 * Implements AC-002: Streak achievements for consecutive practice days (3, 7, 14)
 * Implements AC-006: Topic-specific achievements (Addition Master, Subtraction Star, etc.)
 * Implements AC-003: Progress indicators for next milestone
 */

import { Injectable } from '@nestjs/common';
import {
  Achievement,
  StudentAchievements,
  STANDARD_ACHIEVEMENTS,
  ACHIEVEMENT_MILESTONES,
  STREAK_MILESTONES,
  TOPIC_MASTERY_REQUIREMENTS,
} from '../types/achievement.types';

/**
 * Student achievement state (in-memory storage)
 */
interface StudentAchievementState {
  studentId: string;
  achievements: Achievement[];
  lastChecked: Date;
}

@Injectable()
export class AchievementService {
  // In-memory storage (temporary - will use MongoDB)
  private studentAchievements: Map<string, StudentAchievementState> = new Map();

  /**
   * Check and unlock milestone achievements based on correct answer count
   *
   * Detects when students reach achievement thresholds (10, 25, 50).
   * Implements AC-006 requirement for milestone-based achievements.
   *
   * @param studentId - Unique student identifier
   * @param totalCorrectAnswers - Total number of correct answers achieved
   * @returns Array of newly unlocked achievements
   */
  async checkMilestones(
    studentId: string,
    totalCorrectAnswers: number
  ): Promise<Achievement[]> {
    // Initialize student achievements if not exists
    if (!this.studentAchievements.has(studentId)) {
      this.initializeStudentAchievements(studentId);
    }

    const studentState = this.studentAchievements.get(studentId)!;
    const newlyUnlocked: Achievement[] = [];

    // Check each milestone achievement
    for (const achievement of studentState.achievements) {
      if (achievement.category === 'milestone' && !achievement.unlocked) {
        const targetValue = achievement.criteria.targetValue;

        // Check if milestone threshold is reached
        if (totalCorrectAnswers >= targetValue) {
          achievement.unlocked = true;
          achievement.unlockedDate = new Date();
          achievement.progress = 100;
          newlyUnlocked.push(achievement);
        } else {
          // Update progress percentage
          achievement.progress = Math.round(
            (totalCorrectAnswers / targetValue) * 100
          );
        }
      }
    }

    studentState.lastChecked = new Date();
    return newlyUnlocked;
  }

  /**
   * Check and unlock streak achievements based on consecutive practice days
   *
   * Detects when students reach streak thresholds (3, 7, 14 days).
   * Implements AC-002 requirement for consecutive day achievements.
   *
   * @param studentId - Unique student identifier
   * @param currentStreak - Current number of consecutive practice days
   * @returns Array of newly unlocked achievements
   *
   * @example
   * ```typescript
   * // Check if student earned streak achievements
   * const unlocked = await achievementService.checkStreaks('student-123', 7);
   * // Returns [{ id: 'streak_starter', ... }, { id: 'week_warrior', ... }]
   * ```
   */
  async checkStreaks(
    studentId: string,
    currentStreak: number
  ): Promise<Achievement[]> {
    // Initialize student achievements if not exists
    if (!this.studentAchievements.has(studentId)) {
      this.initializeStudentAchievements(studentId);
    }

    const studentState = this.studentAchievements.get(studentId)!;
    const newlyUnlocked: Achievement[] = [];

    // Check each streak achievement
    for (const achievement of studentState.achievements) {
      if (achievement.category === 'streak' && !achievement.unlocked) {
        const targetValue = achievement.criteria.targetValue;

        // Check if streak threshold is reached
        if (currentStreak >= targetValue) {
          achievement.unlocked = true;
          achievement.unlockedDate = new Date();
          achievement.progress = 100;
          newlyUnlocked.push(achievement);
        } else {
          // Update progress percentage
          achievement.progress = Math.round(
            (currentStreak / targetValue) * 100
          );
        }
      }
    }

    studentState.lastChecked = new Date();
    return newlyUnlocked;
  }

  /**
   * Check and unlock topic mastery achievements based on performance
   *
   * Detects when students demonstrate mastery in specific topics.
   * Implements AC-006 requirement for topic-specific achievements.
   *
   * @param studentId - Unique student identifier
   * @param topicStats - Topic performance statistics
   * @param topicStats.topic - Topic name (Addition, Subtraction, etc.)
   * @param topicStats.questionsAttempted - Total questions in this topic
   * @param topicStats.correctAnswers - Correct answers in this topic
   * @param topicStats.accuracyPercentage - Accuracy percentage (0-100)
   * @returns Array of newly unlocked achievements
   *
   * @example
   * ```typescript
   * // Check if student earned Addition Master achievement
   * const unlocked = await achievementService.checkTopicMastery('student-123', {
   *   topic: 'Addition',
   *   questionsAttempted: 25,
   *   correctAnswers: 22,
   *   accuracyPercentage: 88
   * });
   * ```
   */
  async checkTopicMastery(
    studentId: string,
    topicStats: {
      topic: string;
      questionsAttempted: number;
      correctAnswers: number;
      accuracyPercentage: number;
    }
  ): Promise<Achievement[]> {
    // Initialize student achievements if not exists
    if (!this.studentAchievements.has(studentId)) {
      this.initializeStudentAchievements(studentId);
    }

    const studentState = this.studentAchievements.get(studentId)!;
    const newlyUnlocked: Achievement[] = [];

    // Check each topic mastery achievement
    for (const achievement of studentState.achievements) {
      if (achievement.category === 'topic_mastery' && !achievement.unlocked) {
        // Check if this achievement is for the current topic
        if (achievement.criteria.topic === topicStats.topic) {
          const minQuestions = achievement.criteria.targetValue;
          const minAccuracy = achievement.criteria.minimumAccuracy || 80;

          // Check if mastery criteria are met
          const questionsMet = topicStats.questionsAttempted >= minQuestions;
          const accuracyMet = topicStats.accuracyPercentage >= minAccuracy;

          if (questionsMet && accuracyMet) {
            // Unlock achievement
            achievement.unlocked = true;
            achievement.unlockedDate = new Date();
            achievement.progress = 100;
            newlyUnlocked.push(achievement);
          } else {
            // Calculate progress percentage
            // Progress based on question count (50%) and accuracy (50%)
            const questionProgress =
              (topicStats.questionsAttempted / minQuestions) * 50;
            const accuracyProgress =
              (topicStats.accuracyPercentage / minAccuracy) * 50;

            achievement.progress = Math.min(
              100,
              Math.round(questionProgress + accuracyProgress)
            );
          }
        }
      }
    }

    studentState.lastChecked = new Date();
    return newlyUnlocked;
  }

  /**
   * Get all achievements for a student
   *
   * Returns complete achievement state including locked/unlocked status,
   * total points earned, and recently unlocked achievements.
   *
   * @param studentId - Unique student identifier
   * @returns Complete student achievement data
   */
  async getStudentAchievements(
    studentId: string
  ): Promise<StudentAchievements> {
    // Initialize if not exists
    if (!this.studentAchievements.has(studentId)) {
      this.initializeStudentAchievements(studentId);
    }

    const studentState = this.studentAchievements.get(studentId)!;

    // Calculate total points
    const totalPoints = studentState.achievements
      .filter((a) => a.unlocked)
      .reduce((sum, a) => sum + a.pointValue, 0);

    // Get recently unlocked (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentlyUnlocked = studentState.achievements.filter(
      (a) => a.unlocked && a.unlockedDate && a.unlockedDate >= sevenDaysAgo
    );

    // Get next milestone
    const nextMilestone = this.findNextMilestone(studentState.achievements);

    return {
      studentId,
      achievements: studentState.achievements,
      totalPoints,
      recentlyUnlocked,
      nextMilestone,
    };
  }

  /**
   * Get next milestone achievement and progress towards it
   *
   * Calculates progress percentage towards next unlockable achievement.
   * Implements AC-003 requirement for progress indicators.
   *
   * @param studentId - Unique student identifier
   * @param currentCorrectAnswers - Current total of correct answers
   * @returns Next milestone achievement with progress percentage
   */
  async getNextMilestone(
    studentId: string,
    currentCorrectAnswers: number
  ): Promise<Achievement> {
    // Initialize if not exists
    if (!this.studentAchievements.has(studentId)) {
      this.initializeStudentAchievements(studentId);
    }

    const studentState = this.studentAchievements.get(studentId)!;

    // First, ensure milestones are checked/unlocked based on current progress
    await this.checkMilestones(studentId, currentCorrectAnswers);

    // Find next locked milestone
    const milestoneAchievements = studentState.achievements
      .filter((a) => a.category === 'milestone')
      .sort((a, b) => a.criteria.targetValue - b.criteria.targetValue);

    let nextMilestone = milestoneAchievements.find((a) => !a.unlocked);

    if (!nextMilestone) {
      // All milestones unlocked - return last one at 100%
      nextMilestone = milestoneAchievements[milestoneAchievements.length - 1];
      nextMilestone.progress = 100;
    } else {
      // Calculate progress to next milestone
      const targetValue = nextMilestone.criteria.targetValue;
      nextMilestone.progress = Math.min(
        100,
        Math.round((currentCorrectAnswers / targetValue) * 100)
      );
    }

    return nextMilestone;
  }

  /**
   * Initialize achievement state for a new student
   *
   * Creates unlocked=false copies of all standard achievements.
   *
   * @param studentId - Unique student identifier
   */
  private initializeStudentAchievements(studentId: string): void {
    const achievements: Achievement[] = STANDARD_ACHIEVEMENTS.map(
      (template) => ({
        ...template,
        unlocked: false,
        unlockedDate: undefined,
        progress: 0,
      })
    );

    this.studentAchievements.set(studentId, {
      studentId,
      achievements,
      lastChecked: new Date(),
    });
  }

  /**
   * Find the next milestone to work towards
   *
   * Helper method to identify next achievement in progression.
   *
   * @param achievements - Array of student achievements
   * @returns Next locked milestone achievement, or undefined if all unlocked
   */
  private findNextMilestone(
    achievements: Achievement[]
  ): Achievement | undefined {
    return achievements
      .filter((a) => a.category === 'milestone' && !a.unlocked)
      .sort((a, b) => a.criteria.targetValue - b.criteria.targetValue)[0];
  }
}
