/**
 * Achievement Models
 *
 * Frontend type definitions for achievement system.
 * Matches backend DTOs for API integration.
 */

/**
 * Individual achievement badge
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'milestone' | 'streak' | 'topic_mastery' | 'accuracy' | 'speed';
  badgeIcon: string;
  pointValue: number;
  unlocked: boolean;
  unlockedDate?: Date;
  progress: number; // 0-100 percentage
}

/**
 * Complete student achievements data
 */
export interface StudentAchievements {
  studentId: string;
  achievements: Achievement[];
  totalPoints: number;
  recentlyUnlocked: Achievement[];
  nextMilestone?: Achievement;
}

/**
 * Next milestone information
 */
export interface NextMilestone {
  studentId: string;
  nextMilestone: {
    id: string;
    name: string;
    description: string;
    threshold: number;
  };
  currentCorrectAnswers: number;
  progressPercentage: number;
  questionsRemaining: number;
}
