/**
 * Progress Tracking Type Definitions
 *
 * Supports User Story US-PT-001: Basic Progress Tracking
 * - AC-001: Daily question count tracking
 * - AC-002: Correct answers count and percentage
 * - AC-004: Weekly improvement tracking
 * - AC-005: Daily reset with weekly history
 * - REQ-PT-001: Track by topic and difficulty
 * - REQ-PT-002: Session data (time, attempts, accuracy)
 */

/**
 * Difficulty levels for questions
 */
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

/**
 * Topic-specific progress tracking
 *
 * Tracks student performance for individual topics at specific difficulty levels.
 * Supports REQ-PT-001: Track progress across topics and difficulty levels.
 *
 * @example
 * ```typescript
 * const topicProgress: TopicProgress = {
 *   topicName: 'Addition',
 *   difficulty: 'easy',
 *   questionsAttempted: 10,
 *   correctAnswers: 8,
 *   accuracyPercentage: 80
 * };
 * ```
 */
export interface TopicProgress {
  /** Name of the mathematical topic (e.g., 'Addition', 'Subtraction') */
  topicName: string;

  /** Difficulty level of questions in this topic */
  difficulty: DifficultyLevel;

  /** Total number of questions attempted in this topic */
  questionsAttempted: number;

  /** Number of correct answers in this topic */
  correctAnswers: number;

  /** Accuracy percentage for this topic (0-100) */
  accuracyPercentage: number;
}

/**
 * Daily progress snapshot for a student
 *
 * Captures all progress metrics for a single day.
 * Supports AC-001 (total questions today) and AC-002 (correct answers and percentage).
 * Implements AC-005 requirement: daily data that can be aggregated for weekly history.
 *
 * @example
 * ```typescript
 * const dailyProgress: DailyProgress = {
 *   studentId: 'student-123',
 *   date: new Date('2024-12-24'),
 *   totalQuestionsAttempted: 8,
 *   correctAnswers: 6,
 *   incorrectAnswers: 2,
 *   accuracyPercentage: 75,
 *   timeSpentMinutes: 45,
 *   topicBreakdown: [],
 *   streakDays: 3
 * };
 * ```
 */
export interface DailyProgress {
  /** Unique identifier for the student */
  studentId: string;

  /** Date of this progress snapshot */
  date: Date;

  /** Total questions attempted today (AC-001) */
  totalQuestionsAttempted: number;

  /** Number of correct answers today (AC-002) */
  correctAnswers: number;

  /** Number of incorrect answers today */
  incorrectAnswers: number;

  /** Accuracy percentage for today (0-100) (AC-002) */
  accuracyPercentage: number;

  /** Total time spent practicing today in minutes (REQ-PT-002) */
  timeSpentMinutes: number;

  /** Breakdown by topic and difficulty (REQ-PT-001) */
  topicBreakdown: TopicProgress[];

  /** Current learning streak in days */
  streakDays: number;
}

/**
 * Weekly progress aggregation
 *
 * Aggregates daily progress over a week period.
 * Supports AC-004 (improvement over last week) and AC-005 (maintains weekly history).
 */
export interface WeeklyProgress {
  /** Unique identifier for the student */
  studentId: string;

  /** Start date of the week */
  weekStartDate: Date;

  /** End date of the week */
  weekEndDate: Date;

  /** Daily progress snapshots for the week (AC-005) */
  dailySnapshots: DailyProgress[];

  /** Total questions attempted this week */
  totalQuestionsAttempted: number;

  /** Total correct answers this week */
  totalCorrectAnswers: number;

  /** Average accuracy percentage for the week (0-100) */
  weeklyAccuracyPercentage: number;

  /** Total time spent this week in minutes */
  totalTimeSpentMinutes: number;

  /** Improvement percentage compared to previous week (AC-004) */
  improvementPercentage: number;
}

/**
 * Individual learning session data
 *
 * Tracks metrics for a single practice session.
 * Supports REQ-PT-002: Store session data including time, attempts, accuracy.
 */
export interface SessionData {
  /** Unique identifier for the session */
  sessionId: string;

  /** Unique identifier for the student */
  studentId: string;

  /** Session start timestamp */
  startTime: Date;

  /** Session end timestamp */
  endTime: Date;

  /** Session duration in minutes (REQ-PT-002) */
  durationMinutes: number;

  /** Number of questions attempted in this session (REQ-PT-002) */
  questionsAttempted: number;

  /** Number of correct answers in this session */
  correctAnswers: number;

  /** Session accuracy percentage (0-100) (REQ-PT-002) */
  accuracyPercentage: number;

  /** Topics studied in this session */
  topicsStudied: string[];
}

/**
 * Overall statistics across all time
 *
 * Lifetime achievement tracking for a student.
 * Used for milestone achievements (AC-006: 10, 25, 50 correct answers).
 */
export interface OverallStats {
  /** Total questions attempted across all time */
  totalQuestionsAllTime: number;

  /** Total correct answers across all time (for AC-006 milestones) */
  totalCorrectAllTime: number;

  /** Overall accuracy percentage (0-100) */
  overallAccuracyPercentage: number;

  /** Current consecutive days streak */
  currentStreak: number;

  /** Longest consecutive days streak achieved */
  longestStreak: number;
}

/**
 * Complete progress summary for a student
 *
 * Aggregates daily, weekly, and overall progress for dashboard display.
 * Provides all data needed to satisfy AC-001 through AC-006.
 */
export interface ProgressSummary {
  /** Unique identifier for the student */
  studentId: string;

  /** Current date for this summary */
  currentDate: Date;

  /** Today's progress (AC-001, AC-002) */
  dailyProgress: DailyProgress;

  /** This week's progress (AC-004, AC-005) */
  weeklyProgress: WeeklyProgress;

  /** Overall lifetime statistics (AC-006) */
  overallStats: OverallStats;
}
