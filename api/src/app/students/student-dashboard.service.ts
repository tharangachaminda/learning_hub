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
import { getMathematicsYearPlan } from '../ai/mathematics-curriculum.criteria';

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

  private readonly DEFAULT_GRADE = 3;

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
    const recentActivity = this.buildRecentActivity(
      dailyProgress,
      profile.grade
    );
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
   * Builds recommendations from the student's current grade curriculum and
   * latest tracked progress so the dashboard reflects current mastery gaps.
   *
   * @param studentId - Student identifier
   * @returns Array of TopicRecommendationDto
   */
  async getRecommendations(
    studentId: string
  ): Promise<TopicRecommendationDto[]> {
    const profile = await this.getStudentProfile(studentId);
    const subjects = await this.getProgressSummary(studentId, profile.grade);

    const prioritized = [...subjects].sort((left, right) => {
      const leftPractised = left.questionsAnswered > 0 ? 0 : 1;
      const rightPractised = right.questionsAnswered > 0 ? 0 : 1;

      if (leftPractised !== rightPractised) {
        return leftPractised - rightPractised;
      }

      if (left.masteryPercentage !== right.masteryPercentage) {
        return left.masteryPercentage - right.masteryPercentage;
      }

      return left.questionsAnswered - right.questionsAnswered;
    });

    return prioritized.slice(0, 3).map((subject, index) => ({
      id: `rec-${subject.subject.toLowerCase()}`,
      topic: subject.displayName,
      subject: 'mathematics',
      reason:
        subject.questionsAnswered > 0
          ? `Your current mastery in ${subject.displayName} is ${subject.masteryPercentage}%. Another short practice round can strengthen it.`
          : `You have not practised ${subject.displayName} recently. A quick session will keep this topic fresh.`,
      difficulty: this.getRecommendationDifficulty(subject),
      estimatedMinutes: 8 + index * 2,
    }));
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
    grade?: number
  ): Promise<SubjectProgressDto[]> {
    const resolvedGrade =
      grade ?? (await this.getStudentProfile(studentId)).grade;
    const dailyProgress = await this.progressService.calculateDailyProgress(
      studentId,
      new Date()
    );

    const topicMap = new Map<
      string,
      {
        questionsAnswered: number;
        correct: number;
        displayName: string;
        icon: string;
      }
    >();

    for (const tp of dailyProgress.topicBreakdown) {
      const resolvedTopic = this.resolveCurriculumTopic(
        resolvedGrade,
        tp.topicName
      );
      const topicKey = resolvedTopic?.key ?? tp.topicName;
      const existing = topicMap.get(topicKey) ?? {
        questionsAnswered: 0,
        correct: 0,
        displayName: resolvedTopic?.label ?? tp.topicName,
        icon: this.getTopicIcon(
          resolvedTopic?.strand,
          resolvedTopic?.label ?? tp.topicName
        ),
      };
      existing.questionsAnswered += tp.questionsAttempted;
      existing.correct += tp.correctAnswers;
      topicMap.set(topicKey, existing);
    }

    const gradeSubjects = this.getSubjectsForGrade(resolvedGrade);

    if (gradeSubjects.length === 0) {
      return Array.from(topicMap.entries()).map(([topicKey, data]) => ({
        subject: topicKey,
        displayName: data.displayName,
        icon: data.icon,
        masteryPercentage:
          data.questionsAnswered > 0
            ? Math.round((data.correct / data.questionsAnswered) * 100)
            : 0,
        questionsAnswered: data.questionsAnswered,
        lastPracticed:
          data.questionsAnswered > 0 ? new Date().toISOString() : undefined,
      }));
    }

    return gradeSubjects.map((subject) => {
      const data = topicMap.get(subject.subject);
      return {
        subject: subject.subject,
        displayName: subject.displayName,
        icon: subject.icon,
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
      grade: user.profile.grade ?? this.DEFAULT_GRADE,
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
  private buildRecentActivity(
    dailyProgress: {
      topicBreakdown: Array<{
        topicName: string;
        difficulty: string;
        questionsAttempted: number;
        correctAnswers: number;
        accuracyPercentage: number;
      }>;
      timeSpentMinutes: number;
    },
    grade: number
  ): PracticeSessionDto[] {
    return dailyProgress.topicBreakdown.slice(0, 5).map((tp, idx) => ({
      id: `session-${Date.now()}-${idx}`,
      subject: 'mathematics',
      topic:
        this.resolveCurriculumTopic(grade, tp.topicName)?.label ?? tp.topicName,
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

  private getSubjectsForGrade(
    grade: number
  ): Array<{ subject: string; displayName: string; icon: string }> {
    const yearPlan = getMathematicsYearPlan(grade);

    return (yearPlan?.topics ?? []).map((topic) => ({
      subject: topic.key,
      displayName: topic.label,
      icon: this.getTopicIcon(topic.strand, topic.label),
    }));
  }

  private resolveCurriculumTopic(grade: number, topicValue: string) {
    const normalizedTopic = topicValue.trim().toLowerCase();
    const yearPlan = getMathematicsYearPlan(grade);

    if (!yearPlan || !normalizedTopic) {
      return null;
    }

    return (
      yearPlan.topics.find(
        (topic) =>
          topic.key.toLowerCase() === normalizedTopic ||
          topic.label.toLowerCase() === normalizedTopic ||
          topic.legacyTopicKeys?.some(
            (legacyTopicKey) => legacyTopicKey.toLowerCase() === normalizedTopic
          )
      ) ?? null
    );
  }

  private getTopicIcon(strand?: string, label?: string): string {
    const normalizedLabel = label?.toLowerCase() ?? '';

    if (strand === 'Algebra') {
      return '📈';
    }

    if (
      strand === 'Measurement' ||
      strand === 'Geometry' ||
      normalizedLabel.includes('geometry') ||
      normalizedLabel.includes('shape')
    ) {
      return '📐';
    }

    if (
      normalizedLabel.includes('data') ||
      normalizedLabel.includes('probability') ||
      normalizedLabel.includes('statistics')
    ) {
      return '📊';
    }

    return '🧮';
  }

  private getRecommendationDifficulty(
    subject: SubjectProgressDto
  ): 'easy' | 'medium' | 'hard' {
    if (subject.questionsAnswered === 0 || subject.masteryPercentage < 50) {
      return 'easy';
    }

    if (subject.masteryPercentage < 80) {
      return 'medium';
    }

    return 'hard';
  }
}
