/**
 * Student Dashboard Service
 *
 * Aggregates data from ProgressTrackingService, AchievementService, and the
 * User model to produce the composite payload consumed by the student-app
 * dashboard screen (US-UI-S-002).
 *
 * All four frontend DashboardService endpoints are backed by methods here:
 *   - getDashboardData  → GET /api/students/:id/dashboard
 *   - getRecommendations → GET /api/students/:id/recommendations
 *   - getProgressSummary → GET /api/students/:id/progress/summary
 *   - getRecentAchievements → GET /api/students/:id/achievements/recent
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { ProgressTrackingService } from '../progress/services/progress-tracking.service';
import { AchievementService } from '../progress/services/achievement.service';

/* ------------------------------------------------------------------ */
/*  Response shapes – mirroring frontend models/dashboard.model.ts    */
/* ------------------------------------------------------------------ */

/** Student profile summary shown on the dashboard. */
export interface StudentProfileDto {
  id: string;
  firstName: string;
  lastName: string;
  grade: number;
  avatarUrl?: string;
}

/** Daily practice-goal progress (AC3). */
export interface DailyGoalDto {
  targetMinutes: number;
  completedMinutes: number;
  percentage: number;
}

/** Practice streak data (AC4). */
export interface StreakDto {
  current: number;
  longest: number;
}

/** AI topic recommendation (AC5). */
export interface TopicRecommendationDto {
  id: string;
  topic: string;
  subject: string;
  reason: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedMinutes: number;
}

/** A completed practice session (AC6). */
export interface PracticeSessionDto {
  id: string;
  subject: string;
  topic: string;
  score: number;
  questionsAnswered: number;
  correctAnswers: number;
  completedAt: string;
  durationMinutes: number;
}

/** Per-subject progress card (AC8). */
export interface SubjectProgressDto {
  subject: string;
  displayName: string;
  icon: string;
  masteryPercentage: number;
  questionsAnswered: number;
  lastPracticed?: string;
}

/** Achievement badge. */
export interface AchievementDto {
  id: string;
  name: string;
  description: string;
  category: string;
  badgeIcon: string;
  pointValue: number;
  unlocked: boolean;
  unlockedDate?: Date;
  progress: number;
}

/** Full aggregated dashboard payload. */
export interface DashboardDataDto {
  student: StudentProfileDto;
  dailyGoal: DailyGoalDto;
  streak: StreakDto;
  recommendations: TopicRecommendationDto[];
  recentActivity: PracticeSessionDto[];
  achievements: AchievementDto[];
  subjects: SubjectProgressDto[];
}

@Injectable()
export class StudentDashboardService {
  /** Default daily goal in minutes. */
  private readonly DEFAULT_DAILY_GOAL_MINUTES = 30;

  /**
   * Grade-based subject definitions.
   *
   * Maps student grade to the topics available in the curriculum.
   * Mirrors GRADE_TOPICS from the frontend curriculum.data.ts.
   */
  private readonly GRADE_SUBJECTS: Record<
    number,
    Array<{ subject: string; displayName: string; icon: string }>
  > = {
    3: [
      { subject: 'ADDITION', displayName: 'Addition', icon: '➕' },
      { subject: 'SUBTRACTION', displayName: 'Subtraction', icon: '➖' },
      { subject: 'MULTIPLICATION', displayName: 'Multiplication', icon: '✖️' },
      { subject: 'DIVISION', displayName: 'Division', icon: '➗' },
      {
        subject: 'PATTERN_RECOGNITION',
        displayName: 'Pattern Recognition',
        icon: '🔮',
      },
    ],
    4: [
      { subject: 'ADDITION', displayName: 'Addition', icon: '➕' },
      { subject: 'SUBTRACTION', displayName: 'Subtraction', icon: '➖' },
      { subject: 'MULTIPLICATION', displayName: 'Multiplication', icon: '✖️' },
      { subject: 'DIVISION', displayName: 'Division', icon: '➗' },
      { subject: 'DECIMAL_BASICS', displayName: 'Decimals', icon: '🔢' },
      { subject: 'FRACTION_BASICS', displayName: 'Fractions', icon: '🍕' },
      { subject: 'PLACE_VALUE', displayName: 'Place Value', icon: '🔟' },
      {
        subject: 'PATTERN_RECOGNITION',
        displayName: 'Pattern Recognition',
        icon: '🔮',
      },
      {
        subject: 'SHAPE_PROPERTIES',
        displayName: 'Shape Properties',
        icon: '📐',
      },
      {
        subject: 'TIME_MEASUREMENT',
        displayName: 'Time Measurement',
        icon: '⏰',
      },
    ],
    5: [
      {
        subject: 'ADVANCED_ARITHMETIC',
        displayName: 'Advanced Arithmetic',
        icon: '🧮',
      },
      {
        subject: 'ALGEBRAIC_THINKING',
        displayName: 'Algebraic Thinking',
        icon: '🔤',
      },
      {
        subject: 'DECIMAL_OPERATIONS',
        displayName: 'Decimal Operations',
        icon: '🔢',
      },
      {
        subject: 'FRACTION_OPERATIONS',
        displayName: 'Fraction Operations',
        icon: '🍕',
      },
      {
        subject: 'RATIO_PROPORTION',
        displayName: 'Ratio & Proportion',
        icon: '⚖️',
      },
    ],
    6: [
      {
        subject: 'LARGE_NUMBER_OPERATIONS',
        displayName: 'Large Numbers',
        icon: '🔢',
      },
      {
        subject: 'ADVANCED_FRACTIONS_DECIMALS',
        displayName: 'Advanced Fractions & Decimals',
        icon: '🍕',
      },
      {
        subject: 'ALGEBRAIC_EQUATIONS',
        displayName: 'Algebraic Equations',
        icon: '🔤',
      },
      {
        subject: 'AREA_VOLUME_CALCULATIONS',
        displayName: 'Area & Volume',
        icon: '📐',
      },
      {
        subject: 'COORDINATE_GEOMETRY',
        displayName: 'Coordinate Geometry',
        icon: '📍',
      },
      { subject: 'DATA_ANALYSIS', displayName: 'Data Analysis', icon: '📊' },
      { subject: 'PROBABILITY_BASICS', displayName: 'Probability', icon: '🎲' },
    ],
    7: [
      {
        subject: 'ADVANCED_NUMBER_OPERATIONS',
        displayName: 'Advanced Number Operations',
        icon: '🧮',
      },
      {
        subject: 'FRACTION_DECIMAL_MASTERY',
        displayName: 'Fraction & Decimal Mastery',
        icon: '🍕',
      },
      {
        subject: 'ALGEBRAIC_FOUNDATIONS',
        displayName: 'Algebraic Foundations',
        icon: '🔤',
      },
      {
        subject: 'GEOMETRY_SPATIAL_REASONING',
        displayName: 'Geometry & Spatial Reasoning',
        icon: '📐',
      },
      {
        subject: 'MULTI_UNIT_CONVERSIONS',
        displayName: 'Unit Conversions',
        icon: '📏',
      },
      {
        subject: 'DATA_ANALYSIS_PROBABILITY',
        displayName: 'Data & Probability',
        icon: '📊',
      },
    ],
    8: [
      {
        subject: 'PRIME_COMPOSITE_NUMBERS',
        displayName: 'Prime & Composite Numbers',
        icon: '🔢',
      },
      {
        subject: 'NEGATIVE_NUMBERS',
        displayName: 'Negative Numbers',
        icon: '➖',
      },
      {
        subject: 'FRACTION_DECIMAL_PERCENTAGE',
        displayName: 'Fractions, Decimals & %',
        icon: '🍕',
      },
      {
        subject: 'LINEAR_EQUATIONS',
        displayName: 'Linear Equations',
        icon: '📈',
      },
      {
        subject: 'PERIMETER_AREA_VOLUME',
        displayName: 'Perimeter, Area & Volume',
        icon: '📐',
      },
      {
        subject: 'RATIOS_PROPORTIONS',
        displayName: 'Ratios & Proportions',
        icon: '⚖️',
      },
      {
        subject: 'FINANCIAL_LITERACY',
        displayName: 'Financial Literacy',
        icon: '💰',
      },
    ],
  };

  /** Fallback subjects for grades not explicitly mapped. */
  private readonly FALLBACK_SUBJECTS: Array<{
    subject: string;
    displayName: string;
    icon: string;
  }> = [
    { subject: 'ADDITION', displayName: 'Addition', icon: '➕' },
    { subject: 'SUBTRACTION', displayName: 'Subtraction', icon: '➖' },
    { subject: 'MULTIPLICATION', displayName: 'Multiplication', icon: '✖️' },
    { subject: 'DIVISION', displayName: 'Division', icon: '➗' },
  ];

  /**
   * Get subjects appropriate for a given grade level.
   *
   * @param grade - Student grade (3-8)
   * @returns Array of subject definitions for the grade
   */
  private getSubjectsForGrade(
    grade: number
  ): Array<{ subject: string; displayName: string; icon: string }> {
    return this.GRADE_SUBJECTS[grade] ?? this.FALLBACK_SUBJECTS;
  }

  /** Static recommendations (placeholder until AI engine is wired). */
  private readonly SEED_RECOMMENDATIONS: TopicRecommendationDto[] = [
    {
      id: 'rec-1',
      topic: 'Fractions',
      subject: 'math',
      reason: 'Strengthen your fraction skills with some fun practice!',
      difficulty: 'medium',
      estimatedMinutes: 10,
    },
    {
      id: 'rec-2',
      topic: 'Multiplication',
      subject: 'math',
      reason: 'Master your times tables to level up!',
      difficulty: 'easy',
      estimatedMinutes: 8,
    },
    {
      id: 'rec-3',
      topic: 'Word Problems',
      subject: 'math',
      reason: 'Practice applying math to real-world scenarios.',
      difficulty: 'hard',
      estimatedMinutes: 15,
    },
  ];

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly progressService: ProgressTrackingService,
    private readonly achievementService: AchievementService
  ) {}

  /**
   * Build the full aggregated dashboard payload for a student.
   *
   * @param studentId - MongoDB ObjectId string of the student
   * @returns DashboardDataDto containing all dashboard sections
   * @throws NotFoundException when the student does not exist
   */
  async getDashboardData(studentId: string): Promise<DashboardDataDto> {
    const profile = await this.getStudentProfile(studentId);
    const dailyProgress = await this.progressService.calculateDailyProgress(
      studentId,
      new Date()
    );

    const dailyGoal: DailyGoalDto = {
      targetMinutes: this.DEFAULT_DAILY_GOAL_MINUTES,
      completedMinutes: dailyProgress.timeSpentMinutes,
      percentage: Math.min(
        100,
        Math.round(
          (dailyProgress.timeSpentMinutes / this.DEFAULT_DAILY_GOAL_MINUTES) *
            100
        )
      ),
    };

    const streak: StreakDto = {
      current: dailyProgress.streakDays,
      longest: dailyProgress.streakDays, // in-memory service doesn't track longest separately
    };

    const recommendations = await this.getRecommendations(studentId);
    const recentActivity = this.buildRecentActivity(dailyProgress);
    const achievements = await this.getRecentAchievements(studentId);
    const subjects = await this.getProgressSummary(studentId, profile.grade);

    return {
      student: profile,
      dailyGoal,
      streak,
      recommendations,
      recentActivity,
      achievements,
      subjects,
    };
  }

  /**
   * Return topic recommendations for a student.
   *
   * Currently returns seed data; will be replaced by an AI recommendation
   * engine in a future story.
   *
   * @param studentId - Student identifier (unused for now)
   * @returns Array of TopicRecommendationDto
   */
  async getRecommendations(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    studentId: string
  ): Promise<TopicRecommendationDto[]> {
    return this.SEED_RECOMMENDATIONS;
  }

  /**
   * Per-subject progress summary.
   *
   * Returns subjects appropriate for the student's grade and
   * aggregates topic-level data from today's daily progress.
   *
   * @param studentId - Student identifier
   * @param grade - Student grade level (defaults to 3)
   * @returns Array of SubjectProgressDto tailored to the grade
   */
  async getProgressSummary(
    studentId: string,
    grade = 3
  ): Promise<SubjectProgressDto[]> {
    const dailyProgress = await this.progressService.calculateDailyProgress(
      studentId,
      new Date()
    );

    const topicMap = new Map<
      string,
      { questionsAnswered: number; correct: number }
    >();

    for (const tp of dailyProgress.topicBreakdown) {
      const existing = topicMap.get(tp.topicName) ?? {
        questionsAnswered: 0,
        correct: 0,
      };
      existing.questionsAnswered += tp.questionsAttempted;
      existing.correct += tp.correctAnswers;
      topicMap.set(tp.topicName, existing);
    }

    const gradeSubjects = this.getSubjectsForGrade(grade);

    return gradeSubjects.map((s) => {
      const data = topicMap.get(s.subject);
      return {
        subject: s.subject,
        displayName: s.displayName,
        icon: s.icon,
        masteryPercentage: data
          ? Math.round((data.correct / data.questionsAnswered) * 100)
          : 0,
        questionsAnswered: data?.questionsAnswered ?? 0,
        lastPracticed: data ? new Date().toISOString() : undefined,
      };
    });
  }

  /**
   * Recently unlocked achievements for the dashboard showcase.
   *
   * @param studentId - Student identifier
   * @returns Array of AchievementDto (max 3 most-recent)
   */
  async getRecentAchievements(studentId: string): Promise<AchievementDto[]> {
    const studentAchievements =
      await this.achievementService.getStudentAchievements(studentId);

    return studentAchievements.recentlyUnlocked.slice(0, 3).map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      category: a.category,
      badgeIcon: a.badgeIcon,
      pointValue: a.pointValue,
      unlocked: a.unlocked,
      unlockedDate: a.unlockedDate,
      progress: a.progress,
    }));
  }

  /* ------------------------------------------------------------------ */
  /*  Private helpers                                                     */
  /* ------------------------------------------------------------------ */

  /**
   * Look up a student profile from the User collection.
   *
   * @param studentId - MongoDB _id string
   * @returns StudentProfileDto
   * @throws NotFoundException if no user document matches or ID is invalid
   */
  private async getStudentProfile(
    studentId: string
  ): Promise<StudentProfileDto> {
    if (!Types.ObjectId.isValid(studentId)) {
      throw new NotFoundException(`Student ${studentId} not found`);
    }

    const user = await this.userModel.findById(studentId).exec();

    if (!user) {
      throw new NotFoundException(`Student ${studentId} not found`);
    }

    return {
      id: user._id.toString(),
      firstName: user.profile.firstName,
      lastName: user.profile.lastName,
      grade: user.profile.grade ?? 1,
      avatarUrl: user.selectedAvatar
        ? `/assets/avatars/${user.selectedAvatar}.svg`
        : undefined,
    };
  }

  /**
   * Build recent-activity entries from today's daily progress.
   *
   * Each topic breakdown entry is mapped to a PracticeSessionDto.
   *
   * @param dailyProgress - Today's daily progress data
   * @returns Array of PracticeSessionDto
   */
  private buildRecentActivity(dailyProgress: {
    topicBreakdown: Array<{
      topicName: string;
      difficulty: string;
      questionsAttempted: number;
      correctAnswers: number;
      accuracyPercentage: number;
    }>;
    timeSpentMinutes: number;
  }): PracticeSessionDto[] {
    return dailyProgress.topicBreakdown.slice(0, 5).map((tp, idx) => ({
      id: `session-${Date.now()}-${idx}`,
      subject: 'math',
      topic: tp.topicName,
      score: tp.accuracyPercentage,
      questionsAnswered: tp.questionsAttempted,
      correctAnswers: tp.correctAnswers,
      completedAt: new Date().toISOString(),
      durationMinutes: Math.round(
        dailyProgress.timeSpentMinutes /
          (dailyProgress.topicBreakdown.length || 1)
      ),
    }));
  }
}
