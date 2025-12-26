/**
 * Progress Tracking Controller
 *
 * REST API endpoints for progress tracking and achievements.
 * Supports User Story US-PT-001: Basic Progress Tracking
 *
 * Endpoints:
 * - POST /progress/record - Record question attempt
 * - GET /progress/daily/:studentId - Get daily progress
 * - GET /progress/weekly/:studentId - Get weekly progress
 * - GET /achievements/:studentId - Get student achievements
 * - GET /achievements/:studentId/next - Get next milestone
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ProgressTrackingService } from '../services/progress-tracking.service';
import { AchievementService } from '../services/achievement.service';
import {
  RecordQuestionAttemptDto,
  DailyProgressResponseDto,
  WeeklyProgressResponseDto,
  StudentAchievementsResponseDto,
  AchievementResponseDto,
} from '../dto/progress.dto';

/**
 * Next milestone response structure
 */
interface NextMilestoneResponse {
  studentId: string;
  nextMilestone: {
    id: string;
    name: string;
    description: string;
    threshold: number;
  } | null;
  currentCorrectAnswers: number;
  progressPercentage: number;
  questionsRemaining: number;
}

@ApiTags('Progress Tracking')
@Controller('progress')
export class ProgressController {
  constructor(
    private readonly progressTrackingService: ProgressTrackingService,
    private readonly achievementService: AchievementService
  ) {}

  /**
   * Record a question attempt for a student
   *
   * Captures student's answer and updates progress tracking.
   * Automatically checks for milestone achievements.
   * Implements AC-001, AC-002, AC-006.
   *
   * @param dto - Question attempt data
   * @returns Updated daily progress
   * @throws BadRequestException if validation fails
   *
   * @example
   * POST /progress/record
   * {
   *   "studentId": "student-123",
   *   "questionId": "q-001",
   *   "topic": "addition",
   *   "difficulty": "easy",
   *   "isCorrect": true,
   *   "timeSpentSeconds": 45
   * }
   */
  @Post('record')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a question attempt' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Question attempt recorded successfully',
    type: DailyProgressResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid request data' })
  async recordQuestionAttempt(
    @Body() dto: RecordQuestionAttemptDto
  ): Promise<DailyProgressResponseDto> {
    // Record the attempt
    const dailyProgress =
      await this.progressTrackingService.recordQuestionAttempt(dto.studentId, {
        questionId: dto.questionId,
        topic: dto.topic,
        difficulty: dto.difficulty,
        isCorrect: dto.isCorrect,
        timeSpentSeconds: dto.timeSpentSeconds,
        sessionId: dto.sessionId,
      });

    // Check for milestone achievements
    await this.achievementService.checkMilestones(
      dto.studentId,
      dailyProgress.correctAnswers
    );

    // Map to response DTO
    return {
      studentId: dailyProgress.studentId,
      date: dailyProgress.date,
      totalQuestionsAttempted: dailyProgress.totalQuestionsAttempted,
      correctAnswers: dailyProgress.correctAnswers,
      incorrectAnswers: dailyProgress.incorrectAnswers,
      accuracyPercentage: dailyProgress.accuracyPercentage,
      timeSpentMinutes: Math.round(dailyProgress.timeSpentMinutes),
      streakDays: dailyProgress.streakDays,
      encouragementMessage: this.getEncouragementMessage(
        dailyProgress.accuracyPercentage
      ),
    };
  }

  /**
   * Get daily progress for a student
   *
   * Retrieves aggregated progress for today.
   * Implements AC-001, AC-002, AC-003.
   *
   * @param studentId - Student identifier
   * @returns Daily progress summary
   *
   * @example
   * GET /progress/daily/student-123
   */
  @Get('daily/:studentId')
  @ApiOperation({ summary: 'Get daily progress for a student' })
  @ApiParam({ name: 'studentId', description: 'Student identifier' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Daily progress retrieved successfully',
    type: DailyProgressResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Student not found' })
  async getDailyProgress(
    @Param('studentId') studentId: string
  ): Promise<DailyProgressResponseDto> {
    const dailyProgress =
      await this.progressTrackingService.calculateDailyProgress(
        studentId,
        new Date()
      );

    return {
      studentId: dailyProgress.studentId,
      date: dailyProgress.date,
      totalQuestionsAttempted: dailyProgress.totalQuestionsAttempted,
      correctAnswers: dailyProgress.correctAnswers,
      incorrectAnswers: dailyProgress.incorrectAnswers,
      accuracyPercentage: dailyProgress.accuracyPercentage,
      timeSpentMinutes: Math.round(dailyProgress.timeSpentMinutes),
      streakDays: dailyProgress.streakDays,
      encouragementMessage: this.getEncouragementMessage(
        dailyProgress.accuracyPercentage
      ),
    };
  }

  /**
   * Get weekly progress for a student
   *
   * Retrieves aggregated progress for the current week.
   * Implements AC-004, AC-005.
   *
   * @param studentId - Student identifier
   * @returns Weekly progress with daily snapshots
   *
   * @example
   * GET /progress/weekly/student-123
   */
  @Get('weekly/:studentId')
  @ApiOperation({ summary: 'Get weekly progress for a student' })
  @ApiParam({ name: 'studentId', description: 'Student identifier' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Weekly progress retrieved successfully',
    type: WeeklyProgressResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Student not found' })
  async getWeeklyProgress(
    @Param('studentId') studentId: string
  ): Promise<WeeklyProgressResponseDto> {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);

    const weeklyProgress =
      await this.progressTrackingService.calculateWeeklyProgress(
        studentId,
        weekStart,
        today
      );

    // Map daily snapshots to DTO format
    const dailyBreakdown: DailyProgressResponseDto[] =
      weeklyProgress.dailySnapshots.map((day) => ({
        studentId: day.studentId,
        date: day.date,
        totalQuestionsAttempted: day.totalQuestionsAttempted,
        correctAnswers: day.correctAnswers,
        incorrectAnswers: day.incorrectAnswers,
        accuracyPercentage: day.accuracyPercentage,
        timeSpentMinutes: Math.round(day.timeSpentMinutes),
        streakDays: day.streakDays,
        encouragementMessage: this.getEncouragementMessage(
          day.accuracyPercentage
        ),
      }));

    // Calculate weekly totals
    const totalQuestionsAttempted = weeklyProgress.dailySnapshots.reduce(
      (sum, day) => sum + day.totalQuestionsAttempted,
      0
    );
    const totalCorrectAnswers = weeklyProgress.dailySnapshots.reduce(
      (sum, day) => sum + day.correctAnswers,
      0
    );
    const totalTimeSpentMinutes = weeklyProgress.dailySnapshots.reduce(
      (sum, day) => sum + day.timeSpentMinutes,
      0
    );

    return {
      studentId: weeklyProgress.studentId,
      weekStartDate: weeklyProgress.weekStartDate,
      weekEndDate: weeklyProgress.weekEndDate,
      totalQuestionsAttempted,
      totalCorrectAnswers,
      weeklyAccuracyPercentage: weeklyProgress.weeklyAccuracyPercentage,
      totalTimeSpentMinutes: Math.round(totalTimeSpentMinutes),
      improvementPercentage: weeklyProgress.improvementPercentage,
      dailyBreakdown,
    };
  }

  /**
   * Get all achievements for a student
   *
   * Retrieves achievement status, unlocked badges, and total points.
   * Implements AC-003, AC-006.
   *
   * @param studentId - Student identifier
   * @returns Student achievements with unlock status
   *
   * @example
   * GET /achievements/student-123
   */
  @Get('/achievements/:studentId')
  @ApiOperation({ summary: 'Get student achievements' })
  @ApiParam({ name: 'studentId', description: 'Student identifier' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Achievements retrieved successfully',
    type: StudentAchievementsResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Student not found' })
  async getStudentAchievements(
    @Param('studentId') studentId: string
  ): Promise<StudentAchievementsResponseDto> {
    const achievements = await this.achievementService.getStudentAchievements(
      studentId
    );

    // Map achievements to response DTO
    const achievementDtos: AchievementResponseDto[] =
      achievements.achievements.map((a) => ({
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

    return {
      studentId: achievements.studentId,
      achievements: achievementDtos,
      totalPoints: achievements.totalPoints,
      recentlyUnlocked: achievements.recentlyUnlocked.map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        category: a.category,
        badgeIcon: a.badgeIcon,
        pointValue: a.pointValue,
        unlocked: a.unlocked,
        unlockedDate: a.unlockedDate,
        progress: a.progress,
      })),
    };
  }

  /**
   * Get next milestone information for a student
   *
   * Shows progress toward next achievement.
   * Implements AC-003 (progress indicators).
   *
   * @param studentId - Student identifier
   * @returns Next milestone with progress percentage
   *
   * @example
   * GET /achievements/student-123/next
   */
  @Get('/achievements/:studentId/next')
  @ApiOperation({ summary: 'Get next milestone for a student' })
  @ApiParam({ name: 'studentId', description: 'Student identifier' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Next milestone retrieved successfully',
  })
  @ApiNotFoundResponse({ description: 'Student not found' })
  async getNextMilestone(
    @Param('studentId') studentId: string
  ): Promise<NextMilestoneResponse> {
    const dailyProgress =
      await this.progressTrackingService.calculateDailyProgress(
        studentId,
        new Date()
      );
    const currentCorrectAnswers = dailyProgress.correctAnswers;

    const nextMilestone = await this.achievementService.getNextMilestone(
      studentId,
      currentCorrectAnswers
    );

    // Calculate questions remaining
    const questionsRemaining = nextMilestone.unlocked
      ? 0
      : nextMilestone.criteria.targetValue - currentCorrectAnswers;

    return {
      studentId,
      nextMilestone: {
        id: nextMilestone.id,
        name: nextMilestone.name,
        description: nextMilestone.description,
        threshold: nextMilestone.criteria.targetValue,
      },
      currentCorrectAnswers,
      progressPercentage: nextMilestone.progress,
      questionsRemaining,
    };
  }

  /**
   * Generate encouragement message based on accuracy
   *
   * @param accuracyPercentage - Student's accuracy percentage
   * @returns Encouraging message
   */
  private getEncouragementMessage(accuracyPercentage: number): string {
    if (accuracyPercentage >= 90) {
      return "Amazing work! You're a math superstar! ⭐";
    } else if (accuracyPercentage >= 75) {
      return 'Great job! Keep up the excellent work! 👍';
    } else if (accuracyPercentage >= 60) {
      return "Nice progress! You're getting better! 📈";
    } else if (accuracyPercentage > 0) {
      return 'Keep practicing! You can do it! 💪';
    } else {
      return "Let's get started! Every question helps you learn! 🚀";
    }
  }
}
