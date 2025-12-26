/**
 * Data Transfer Objects for Progress Tracking API
 *
 * Supports User Story US-PT-001: Basic Progress Tracking
 * Defines request/response structures for progress tracking endpoints.
 */

import {
  IsString,
  IsNumber,
  IsDate,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for recording a question attempt
 *
 * Used when student answers a question to track progress.
 * Supports REQ-PT-001 and REQ-PT-002.
 */
export class RecordQuestionAttemptDto {
  @ApiProperty({ description: 'Student identifier' })
  @IsString()
  studentId: string;

  @ApiProperty({ description: 'Question identifier' })
  @IsString()
  questionId: string;

  @ApiProperty({
    description: 'Mathematical topic (e.g., Addition, Subtraction)',
  })
  @IsString()
  topic: string;

  @ApiProperty({
    description: 'Difficulty level',
    enum: ['easy', 'medium', 'hard'],
  })
  @IsString()
  difficulty: 'easy' | 'medium' | 'hard';

  @ApiProperty({ description: 'Whether the answer was correct' })
  @IsBoolean()
  isCorrect: boolean;

  @ApiProperty({ description: 'Time spent on question in seconds' })
  @IsNumber()
  @Min(0)
  timeSpentSeconds: number;

  @ApiPropertyOptional({ description: 'Session identifier' })
  @IsOptional()
  @IsString()
  sessionId?: string;
}

/**
 * DTO for daily progress response
 *
 * Returns today's progress for AC-001 and AC-002.
 */
export class DailyProgressResponseDto {
  @ApiProperty({ description: 'Student identifier' })
  studentId: string;

  @ApiProperty({ description: 'Date of this progress snapshot' })
  @Type(() => Date)
  date: Date;

  @ApiProperty({ description: 'Total questions attempted today (AC-001)' })
  totalQuestionsAttempted: number;

  @ApiProperty({ description: 'Correct answers today (AC-002)' })
  correctAnswers: number;

  @ApiProperty({ description: 'Incorrect answers today' })
  incorrectAnswers: number;

  @ApiProperty({ description: 'Accuracy percentage (0-100) (AC-002)' })
  @Min(0)
  @Max(100)
  accuracyPercentage: number;

  @ApiProperty({ description: 'Time spent practicing today (minutes)' })
  timeSpentMinutes: number;

  @ApiProperty({ description: 'Current learning streak (days)' })
  streakDays: number;

  @ApiProperty({ description: 'Encouraging message for student' })
  encouragementMessage: string;
}

/**
 * DTO for weekly progress response
 *
 * Returns weekly trends for AC-004 and AC-005.
 */
export class WeeklyProgressResponseDto {
  @ApiProperty({ description: 'Student identifier' })
  studentId: string;

  @ApiProperty({ description: 'Week start date' })
  @Type(() => Date)
  weekStartDate: Date;

  @ApiProperty({ description: 'Week end date' })
  @Type(() => Date)
  weekEndDate: Date;

  @ApiProperty({ description: 'Total questions attempted this week' })
  totalQuestionsAttempted: number;

  @ApiProperty({ description: 'Total correct answers this week' })
  totalCorrectAnswers: number;

  @ApiProperty({ description: 'Weekly accuracy percentage (0-100)' })
  @Min(0)
  @Max(100)
  weeklyAccuracyPercentage: number;

  @ApiProperty({ description: 'Total practice time this week (minutes)' })
  totalTimeSpentMinutes: number;

  @ApiProperty({
    description: 'Improvement percentage compared to last week (AC-004)',
  })
  improvementPercentage: number;

  @ApiProperty({
    description: 'Daily breakdown for the week (AC-005)',
    type: [DailyProgressResponseDto],
  })
  @ValidateNested({ each: true })
  @Type(() => DailyProgressResponseDto)
  dailyBreakdown: DailyProgressResponseDto[];
}

/**
 * DTO for achievement response
 *
 * Returns achievement information for AC-006.
 */
export class AchievementResponseDto {
  @ApiProperty({ description: 'Achievement identifier' })
  id: string;

  @ApiProperty({ description: 'Achievement name' })
  name: string;

  @ApiProperty({ description: 'Achievement description' })
  description: string;

  @ApiProperty({ description: 'Achievement category' })
  category: string;

  @ApiProperty({ description: 'Badge icon identifier' })
  badgeIcon: string;

  @ApiProperty({ description: 'Point value' })
  pointValue: number;

  @ApiProperty({ description: 'Whether unlocked' })
  unlocked: boolean;

  @ApiPropertyOptional({ description: 'Unlock date' })
  @Type(() => Date)
  unlockedDate?: Date;

  @ApiProperty({ description: 'Progress towards unlocking (0-100)' })
  @Min(0)
  @Max(100)
  progress: number;
}

/**
 * DTO for student achievements response
 *
 * Returns all achievements for a student (AC-006).
 */
export class StudentAchievementsResponseDto {
  @ApiProperty({ description: 'Student identifier' })
  studentId: string;

  @ApiProperty({
    description: 'All achievements',
    type: [AchievementResponseDto],
  })
  @ValidateNested({ each: true })
  @Type(() => AchievementResponseDto)
  achievements: AchievementResponseDto[];

  @ApiProperty({ description: 'Total points earned' })
  totalPoints: number;

  @ApiProperty({
    description: 'Recently unlocked achievements',
    type: [AchievementResponseDto],
  })
  @ValidateNested({ each: true })
  @Type(() => AchievementResponseDto)
  recentlyUnlocked: AchievementResponseDto[];

  @ApiPropertyOptional({
    description: 'Next milestone achievement',
    type: AchievementResponseDto,
  })
  @Type(() => AchievementResponseDto)
  nextMilestone?: AchievementResponseDto;
}

/**
 * DTO for complete progress summary
 *
 * Aggregated view for dashboard (all acceptance criteria).
 */
export class ProgressSummaryResponseDto {
  @ApiProperty({ description: 'Student identifier' })
  studentId: string;

  @ApiProperty({ description: 'Current date' })
  @Type(() => Date)
  currentDate: Date;

  @ApiProperty({
    description: "Today's progress",
    type: DailyProgressResponseDto,
  })
  @ValidateNested()
  @Type(() => DailyProgressResponseDto)
  dailyProgress: DailyProgressResponseDto;

  @ApiProperty({
    description: "This week's progress",
    type: WeeklyProgressResponseDto,
  })
  @ValidateNested()
  @Type(() => WeeklyProgressResponseDto)
  weeklyProgress: WeeklyProgressResponseDto;

  @ApiProperty({ description: 'Total questions all-time' })
  totalQuestionsAllTime: number;

  @ApiProperty({ description: 'Total correct answers all-time' })
  totalCorrectAllTime: number;

  @ApiProperty({ description: 'Overall accuracy percentage (0-100)' })
  @Min(0)
  @Max(100)
  overallAccuracyPercentage: number;
}
