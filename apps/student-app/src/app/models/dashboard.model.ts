/**
 * Dashboard Data Models
 *
 * Frontend type definitions for the Student Dashboard screen (US-UI-S-002).
 * Matches the API response shapes from dashboard endpoints.
 */

import { Achievement } from './achievement.model';

/**
 * Student profile summary displayed on the dashboard.
 *
 * @property id - Unique student identifier
 * @property firstName - Student's first name (used in welcome banner)
 * @property lastName - Student's last name
 * @property grade - Current grade level (1-12)
 * @property avatarUrl - URL to the student's avatar image
 */
export interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  grade: number;
  avatarUrl?: string;
}

/**
 * Daily practice goal progress data (AC3).
 *
 * @property targetMinutes - Daily goal in minutes
 * @property completedMinutes - Minutes completed today
 * @property percentage - Completion percentage (0-100)
 */
export interface DailyGoal {
  targetMinutes: number;
  completedMinutes: number;
  percentage: number;
}

/**
 * Practice streak data (AC4).
 *
 * @property current - Consecutive days of practice
 * @property longest - All-time longest streak
 */
export interface Streak {
  current: number;
  longest: number;
}

/**
 * AI-powered topic recommendation (AC5).
 *
 * @property id - Unique recommendation identifier
 * @property topic - Topic name (e.g. "Fractions")
 * @property subject - Subject area (e.g. "math")
 * @property reason - Why this topic is recommended
 * @property difficulty - Suggested difficulty level
 * @property estimatedMinutes - Estimated time to complete
 */
export interface TopicRecommendation {
  id: string;
  topic: string;
  subject: string;
  reason: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedMinutes: number;
}

/**
 * A completed practice session shown in recent activity (AC6).
 *
 * @property id - Session identifier
 * @property subject - Subject practiced
 * @property topic - Specific topic
 * @property score - Score as a percentage (0-100)
 * @property questionsAnswered - Total questions in session
 * @property correctAnswers - Number answered correctly
 * @property completedAt - When the session was completed
 * @property durationMinutes - How long the session lasted
 */
export interface PracticeSession {
  id: string;
  subject: string;
  topic: string;
  score: number;
  questionsAnswered: number;
  correctAnswers: number;
  completedAt: string;
  durationMinutes: number;
}

/**
 * Subject progress card data (AC8).
 *
 * @property subject - Subject identifier
 * @property displayName - Human-readable subject name
 * @property icon - Emoji or icon identifier
 * @property masteryPercentage - Overall mastery (0-100)
 * @property questionsAnswered - Total questions attempted
 * @property lastPracticed - ISO date of last practice
 */
export interface SubjectProgress {
  subject: string;
  displayName: string;
  icon: string;
  masteryPercentage: number;
  questionsAnswered: number;
  lastPracticed?: string;
}

/**
 * Complete dashboard data aggregating all sections (AC1-AC10).
 *
 * Returned by GET /api/students/{id}/dashboard.
 *
 * @property student - Student profile summary
 * @property dailyGoal - Daily practice goal progress
 * @property streak - Practice streak data
 * @property recommendations - AI topic recommendations (2-3)
 * @property recentActivity - Last 3 practice sessions
 * @property achievements - 3 most recent badges
 * @property subjects - Subject progress cards
 */
export interface DashboardData {
  student: StudentProfile;
  dailyGoal: DailyGoal;
  streak: Streak;
  recommendations: TopicRecommendation[];
  recentActivity: PracticeSession[];
  achievements: Achievement[];
  subjects: SubjectProgress[];
}
