/**
 * Student Dashboard Controller
 *
 * REST API endpoints for the student dashboard screen (US-UI-S-002).
 * Serves aggregated data consumed by the Angular student-app
 * DashboardService (frontend).
 *
 * Route prefix: `students` → final paths under global `api` prefix:
 *   GET /api/students/:studentId/dashboard
 *   GET /api/students/:studentId/recommendations
 *   GET /api/students/:studentId/progress/summary
 *   GET /api/students/:studentId/achievements/recent
 */

import { Controller, Get, Param, Query, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import {
  StudentDashboardService,
  DashboardDataDto,
  TopicRecommendationDto,
  SubjectProgressDto,
  AchievementDto,
} from './student-dashboard.service';

@ApiTags('Student Dashboard')
@Controller('students')
export class StudentDashboardController {
  constructor(private readonly dashboardService: StudentDashboardService) {}

  /**
   * Get fully aggregated dashboard data for a student.
   *
   * @param studentId - MongoDB ObjectId string of the student
   * @returns DashboardDataDto with all dashboard sections
   */
  @Get(':studentId/dashboard')
  @ApiOperation({ summary: 'Get aggregated student dashboard data' })
  @ApiParam({ name: 'studentId', description: 'Student identifier' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard data retrieved successfully',
  })
  @ApiNotFoundResponse({ description: 'Student not found' })
  async getDashboardData(
    @Param('studentId') studentId: string
  ): Promise<DashboardDataDto> {
    return this.dashboardService.getDashboardData(studentId);
  }

  /**
   * Get AI-powered topic recommendations for a student.
   *
   * @param studentId - Student identifier
   * @returns Array of topic recommendations
   */
  @Get(':studentId/recommendations')
  @ApiOperation({ summary: 'Get topic recommendations for a student' })
  @ApiParam({ name: 'studentId', description: 'Student identifier' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recommendations retrieved successfully',
  })
  async getRecommendations(
    @Param('studentId') studentId: string
  ): Promise<TopicRecommendationDto[]> {
    return this.dashboardService.getRecommendations(studentId);
  }

  /**
   * Get per-subject progress summary for a student.
   *
   * @param studentId - Student identifier
   * @returns Array of subject progress cards
   */
  @Get(':studentId/progress/summary')
  @ApiOperation({ summary: 'Get subject progress summary for a student' })
  @ApiParam({ name: 'studentId', description: 'Student identifier' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Progress summary retrieved successfully',
  })
  async getProgressSummary(
    @Param('studentId') studentId: string,
    @Query('grade') grade?: string
  ): Promise<SubjectProgressDto[]> {
    const gradeNum = grade ? parseInt(grade, 10) : undefined;
    return this.dashboardService.getProgressSummary(studentId, gradeNum);
  }

  /**
   * Get recently unlocked achievements for a student.
   *
   * @param studentId - Student identifier
   * @returns Array of recent achievement badges (max 3)
   */
  @Get(':studentId/achievements/recent')
  @ApiOperation({ summary: 'Get recent achievements for a student' })
  @ApiParam({ name: 'studentId', description: 'Student identifier' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recent achievements retrieved successfully',
  })
  async getRecentAchievements(
    @Param('studentId') studentId: string
  ): Promise<AchievementDto[]> {
    return this.dashboardService.getRecentAchievements(studentId);
  }
}
