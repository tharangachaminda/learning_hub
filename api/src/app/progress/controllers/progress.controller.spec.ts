import { Test, TestingModule } from '@nestjs/testing';
import { ProgressController } from './progress.controller';
import { ProgressTrackingService } from '../services/progress-tracking.service';
import { AchievementService } from '../services/achievement.service';
import { RecordQuestionAttemptDto } from '../dto/progress.dto';
import {
  DailyProgress,
  WeeklyProgress,
} from '../types/progress-tracking.types';
import { StudentAchievements } from '../types/achievement.types';

describe('ProgressController', () => {
  let controller: ProgressController;
  let progressService: ProgressTrackingService;
  let achievementService: AchievementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProgressController],
      providers: [ProgressTrackingService, AchievementService],
    }).compile();

    controller = module.get<ProgressController>(ProgressController);
    progressService = module.get<ProgressTrackingService>(
      ProgressTrackingService
    );
    achievementService = module.get<AchievementService>(AchievementService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /progress/record', () => {
    it('should record a question attempt and return updated daily progress', async () => {
      const dto: RecordQuestionAttemptDto = {
        studentId: 'student-123',
        questionId: 'q-001',
        topic: 'addition',
        difficulty: 'easy',
        isCorrect: true,
        timeSpentSeconds: 45,
      };

      const result = await controller.recordQuestionAttempt(dto);

      expect(result).toBeDefined();
      expect(result.studentId).toBe('student-123');
      expect(result.totalQuestionsAttempted).toBeGreaterThan(0);
      expect(result.correctAnswers).toBeGreaterThan(0);
    });

    it('should handle incorrect answers in attempt recording', async () => {
      const dto: RecordQuestionAttemptDto = {
        studentId: 'student-456',
        questionId: 'q-002',
        topic: 'subtraction',
        difficulty: 'medium',
        isCorrect: false,
        timeSpentSeconds: 60,
      };

      const result = await controller.recordQuestionAttempt(dto);

      expect(result).toBeDefined();
      expect(result.studentId).toBe('student-456');
      expect(result.totalQuestionsAttempted).toBe(1);
      expect(result.correctAnswers).toBe(0);
      expect(result.accuracyPercentage).toBe(0);
    });

    it('should unlock achievements when milestones are reached', async () => {
      const studentId = 'student-milestone';

      // Record 10 correct answers to unlock "First Steps"
      for (let i = 0; i < 10; i++) {
        const dto: RecordQuestionAttemptDto = {
          studentId,
          questionId: `q-${i}`,
          topic: 'addition',
          difficulty: 'easy',
          isCorrect: true,
          timeSpentSeconds: 30,
        };
        await controller.recordQuestionAttempt(dto);
      }

      const achievements = await achievementService.getStudentAchievements(
        studentId
      );
      const firstSteps = achievements.achievements.find(
        (a) => a.id === 'first_steps'
      );

      expect(firstSteps?.unlocked).toBe(true);
      expect(achievements.totalPoints).toBeGreaterThanOrEqual(10);
    });
  });

  describe('GET /progress/daily/:studentId', () => {
    it('should retrieve daily progress for a student', async () => {
      const studentId = 'student-daily-123';

      // Record some attempts
      await progressService.recordQuestionAttempt(studentId, {
        questionId: 'q-001',
        topic: 'addition',
        difficulty: 'easy',
        isCorrect: true,
        timeSpentSeconds: 45,
      });

      const result = await controller.getDailyProgress(studentId);

      expect(result).toBeDefined();
      expect(result.studentId).toBe(studentId);
      expect(result.totalQuestionsAttempted).toBe(1);
      expect(result.correctAnswers).toBe(1);
      expect(result.accuracyPercentage).toBe(100);
    });

    it('should return zero progress for student with no attempts today', async () => {
      const studentId = 'student-no-attempts';

      const result = await controller.getDailyProgress(studentId);

      expect(result).toBeDefined();
      expect(result.studentId).toBe(studentId);
      expect(result.totalQuestionsAttempted).toBe(0);
      expect(result.correctAnswers).toBe(0);
      expect(result.accuracyPercentage).toBe(0);
    });

    it('should include topic breakdown in daily progress', async () => {
      const studentId = 'student-topics';

      await progressService.recordQuestionAttempt(studentId, {
        questionId: 'q-001',
        topic: 'addition',
        difficulty: 'easy',
        isCorrect: true,
        timeSpentSeconds: 30,
      });

      await progressService.recordQuestionAttempt(studentId, {
        questionId: 'q-002',
        topic: 'subtraction',
        difficulty: 'medium',
        isCorrect: true,
        timeSpentSeconds: 45,
      });

      const result = await controller.getDailyProgress(studentId);

      expect(result).toBeDefined();
      expect(result.totalQuestionsAttempted).toBe(2);
      expect(result.correctAnswers).toBe(2);
    });
  });

  describe('GET /progress/weekly/:studentId', () => {
    it('should retrieve weekly progress for a student', async () => {
      const studentId = 'student-weekly-123';

      // Record attempt today
      await progressService.recordQuestionAttempt(studentId, {
        questionId: 'q-001',
        topic: 'addition',
        difficulty: 'easy',
        isCorrect: true,
        timeSpentSeconds: 30,
      });

      const result = await controller.getWeeklyProgress(studentId);

      expect(result).toBeDefined();
      expect(result.studentId).toBe(studentId);
      expect(result.dailyBreakdown).toBeDefined();
      expect(Array.isArray(result.dailyBreakdown)).toBe(true);
    });

    it('should calculate improvement percentage over previous week', async () => {
      const studentId = 'student-improvement';

      // Record attempts
      await progressService.recordQuestionAttempt(studentId, {
        questionId: 'q-001',
        topic: 'addition',
        difficulty: 'easy',
        isCorrect: true,
        timeSpentSeconds: 30,
      });

      const result = await controller.getWeeklyProgress(studentId);

      expect(result).toBeDefined();
      expect(result.improvementPercentage).toBeDefined();
      expect(typeof result.improvementPercentage).toBe('number');
    });

    it('should include daily snapshots for the week', async () => {
      const studentId = 'student-snapshots';

      const result = await controller.getWeeklyProgress(studentId);

      expect(result.dailyBreakdown).toBeDefined();
      expect(result.dailyBreakdown.length).toBeLessThanOrEqual(7);
    });
  });

  describe('GET /achievements/:studentId', () => {
    it('should retrieve all achievements for a student', async () => {
      const studentId = 'student-achievements-123';

      const result = await controller.getStudentAchievements(studentId);

      expect(result).toBeDefined();
      expect(result.studentId).toBe(studentId);
      expect(result.achievements).toBeDefined();
      expect(Array.isArray(result.achievements)).toBe(true);
      expect(result.achievements.length).toBeGreaterThan(0);
    });

    it('should show unlocked status for achievements', async () => {
      const studentId = 'student-unlocked';

      // Unlock "First Steps" by recording 10 correct answers
      for (let i = 0; i < 10; i++) {
        await progressService.recordQuestionAttempt(studentId, {
          questionId: `q-${i}`,
          topic: 'addition',
          difficulty: 'easy',
          isCorrect: true,
          timeSpentSeconds: 30,
        });
      }

      await achievementService.checkMilestones(studentId, 10);

      const result = await controller.getStudentAchievements(studentId);
      const firstSteps = result.achievements.find(
        (a) => a.id === 'first_steps'
      );

      expect(firstSteps).toBeDefined();
      expect(firstSteps?.unlocked).toBe(true);
    });

    it('should calculate total points from unlocked achievements', async () => {
      const studentId = 'student-points';

      // Unlock achievements
      for (let i = 0; i < 25; i++) {
        await progressService.recordQuestionAttempt(studentId, {
          questionId: `q-${i}`,
          topic: 'addition',
          difficulty: 'easy',
          isCorrect: true,
          timeSpentSeconds: 30,
        });
      }

      await achievementService.checkMilestones(studentId, 25);

      const result = await controller.getStudentAchievements(studentId);

      expect(result.totalPoints).toBeGreaterThan(0);
      // Should have at least First Steps (10) + Math Star (25) = 35 points
      expect(result.totalPoints).toBeGreaterThanOrEqual(35);
    });

    it('should include recently unlocked achievements', async () => {
      const studentId = 'student-recent';

      // Record 10 correct answers
      for (let i = 0; i < 10; i++) {
        await progressService.recordQuestionAttempt(studentId, {
          questionId: `q-${i}`,
          topic: 'addition',
          difficulty: 'easy',
          isCorrect: true,
          timeSpentSeconds: 30,
        });
      }

      await achievementService.checkMilestones(studentId, 10);

      const result = await controller.getStudentAchievements(studentId);

      expect(result.recentlyUnlocked).toBeDefined();
      expect(Array.isArray(result.recentlyUnlocked)).toBe(true);
    });
  });

  describe('GET /achievements/:studentId/next', () => {
    it('should retrieve next milestone information', async () => {
      const studentId = 'student-next-milestone';

      // Record 5 correct answers (halfway to first milestone)
      for (let i = 0; i < 5; i++) {
        await progressService.recordQuestionAttempt(studentId, {
          questionId: `q-${i}`,
          topic: 'addition',
          difficulty: 'easy',
          isCorrect: true,
          timeSpentSeconds: 30,
        });
      }

      const result = await controller.getNextMilestone(studentId);

      expect(result).toBeDefined();
      expect(result.nextMilestone).toBeDefined();
      expect(result.progressPercentage).toBe(50); // 5 out of 10
      expect(result.questionsRemaining).toBe(5);
    });

    it('should update next milestone after unlocking current one', async () => {
      const studentId = 'student-milestone-progression';

      // Unlock first milestone (10 correct)
      for (let i = 0; i < 10; i++) {
        await progressService.recordQuestionAttempt(studentId, {
          questionId: `q-${i}`,
          topic: 'addition',
          difficulty: 'easy',
          isCorrect: true,
          timeSpentSeconds: 30,
        });
      }

      await achievementService.checkMilestones(studentId, 10);

      const result = await controller.getNextMilestone(studentId);

      expect(result.nextMilestone).toBeDefined();
      expect(result.nextMilestone?.threshold).toBe(25); // Math Star
    });
  });
});
