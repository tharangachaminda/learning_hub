/**
 * Achievement Type Definitions
 *
 * Supports User Story US-PT-001: Basic Progress Tracking
 * - AC-006: Achievements unlock at milestones (10, 25, 50 correct answers)
 *
 * Defines achievement categories, criteria, and badge types for gamification.
 */

/**
 * Achievement categories for organization
 */
export type AchievementCategory =
  | 'milestone' // Question count milestones
  | 'accuracy' // High accuracy achievements
  | 'streak' // Consecutive day streaks
  | 'topic_mastery' // Topic-specific mastery
  | 'speed'; // Time-based achievements

/**
 * Achievement milestone thresholds
 * Supports AC-006: Milestones at 10, 25, 50 correct answers
 */
export const ACHIEVEMENT_MILESTONES = {
  BEGINNER: 10, // First milestone
  INTERMEDIATE: 25, // Second milestone
  ADVANCED: 50, // Third milestone
  EXPERT: 100, // Bonus milestone
  MASTER: 250, // Long-term milestone
} as const;

/**
 * Achievement badge definitions
 */
export interface Achievement {
  /** Unique achievement identifier */
  id: string;

  /** Display name for the achievement */
  name: string;

  /** Detailed description of how to earn it */
  description: string;

  /** Achievement category */
  category: AchievementCategory;

  /** Criteria for unlocking this achievement */
  criteria: AchievementCriteria;

  /** Badge icon identifier or URL */
  badgeIcon: string;

  /** Point value for gamification */
  pointValue: number;

  /** Whether this achievement is unlocked for the student */
  unlocked: boolean;

  /** Date when achievement was unlocked */
  unlockedDate?: Date;

  /** Progress towards unlocking (0-100 percentage) */
  progress: number;
}

/**
 * Criteria for unlocking achievements
 */
export interface AchievementCriteria {
  /** Type of achievement */
  type:
    | 'question_count'
    | 'accuracy_threshold'
    | 'streak_days'
    | 'topic_mastery'
    | 'time_efficiency';

  /** Target value to achieve */
  targetValue: number;

  /** Optional: Specific topic required */
  topic?: string;

  /** Optional: Minimum accuracy required (0-100) */
  minimumAccuracy?: number;

  /** Optional: Time limit in minutes */
  timeLimitMinutes?: number;
}

/**
 * Student's achievement collection
 */
export interface StudentAchievements {
  /** Student identifier */
  studentId: string;

  /** All achievements (locked and unlocked) */
  achievements: Achievement[];

  /** Total points earned */
  totalPoints: number;

  /** Recently unlocked achievements (last 7 days) */
  recentlyUnlocked: Achievement[];

  /** Next achievement close to unlocking */
  nextMilestone?: Achievement;
}

/**
 * Predefined achievement definitions
 * These are the standard achievements available to all students
 */
export const STANDARD_ACHIEVEMENTS: Omit<
  Achievement,
  'unlocked' | 'unlockedDate' | 'progress'
>[] = [
  {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Answer your first 10 questions correctly',
    category: 'milestone',
    criteria: {
      type: 'question_count',
      targetValue: ACHIEVEMENT_MILESTONES.BEGINNER,
    },
    badgeIcon: 'badge-first-steps',
    pointValue: 10,
  },
  {
    id: 'math_star',
    name: 'Math Star',
    description: 'Answer 25 questions correctly',
    category: 'milestone',
    criteria: {
      type: 'question_count',
      targetValue: ACHIEVEMENT_MILESTONES.INTERMEDIATE,
    },
    badgeIcon: 'badge-math-star',
    pointValue: 25,
  },
  {
    id: 'math_champion',
    name: 'Math Champion',
    description: 'Answer 50 questions correctly',
    category: 'milestone',
    criteria: {
      type: 'question_count',
      targetValue: ACHIEVEMENT_MILESTONES.ADVANCED,
    },
    badgeIcon: 'badge-math-champion',
    pointValue: 50,
  },
  {
    id: 'perfect_score',
    name: 'Perfect Score',
    description: 'Get 100% accuracy on a practice session',
    category: 'accuracy',
    criteria: {
      type: 'accuracy_threshold',
      targetValue: 100,
    },
    badgeIcon: 'badge-perfect-score',
    pointValue: 20,
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Practice every day for 7 days in a row',
    category: 'streak',
    criteria: {
      type: 'streak_days',
      targetValue: 7,
    },
    badgeIcon: 'badge-week-warrior',
    pointValue: 30,
  },
];
