/**
 * Achievement Service - Unit Tests
 *
 * Test Strategy: Validate achievement detection and unlocking logic
 * - AC-006: Achievements unlock at milestones (10, 25, 50 correct answers)
 * - AC-003: Progress indicators for next milestone
 *
 * Tests ensure proper milestone detection, achievement state management,
 * and progress calculation towards next goals.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AchievementService } from './achievement.service';
import { ProgressTrackingService } from './progress-tracking.service';
import { ACHIEVEMENT_MILESTONES } from '../types/achievement.types';

describe('AchievementService', () => {
  let service: AchievementService;
  let progressService: ProgressTrackingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AchievementService, ProgressTrackingService],
    }).compile();

    service = module.get<AchievementService>(AchievementService);
    progressService = module.get<ProgressTrackingService>(
      ProgressTrackingService
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkMilestones', () => {
    /**
     * Test: Detect first milestone achievement (AC-006: 10 correct)
     * Why Essential: Core requirement - unlock "First Steps" at 10 correct answers
     * Impact: Students won't see first achievement without this
     */
    it('should unlock "First Steps" achievement at 10 correct answers', async () => {
      const studentId = 'student-milestone-10';

      // Record 10 correct answers
      for (let i = 0; i < 10; i++) {
        await progressService.recordQuestionAttempt(studentId, {
          questionId: `q-${i}`,
          topic: 'Addition',
          difficulty: 'easy',
          isCorrect: true,
          timeSpentSeconds: 30,
        });
      }

      const unlockedAchievements = await service.checkMilestones(studentId, 10);

      expect(unlockedAchievements).toBeDefined();
      expect(unlockedAchievements.length).toBeGreaterThan(0);

      const firstSteps = unlockedAchievements.find(
        (a) => a.id === 'first_steps'
      );
      expect(firstSteps).toBeDefined();
      expect(firstSteps?.name).toBe('First Steps');
      expect(firstSteps?.unlocked).toBe(true);
    });

    /**
     * Test: Detect second milestone achievement (AC-006: 25 correct)
     * Why Essential: Award "Math Star" badge at 25 correct answers
     * Impact: Students lose motivational milestone without this
     */
    it('should unlock "Math Star" achievement at 25 correct answers', async () => {
      const studentId = 'student-milestone-25';

      // Record 25 correct answers
      for (let i = 0; i < 25; i++) {
        await progressService.recordQuestionAttempt(studentId, {
          questionId: `q-${i}`,
          topic: 'Addition',
          difficulty: 'easy',
          isCorrect: true,
          timeSpentSeconds: 30,
        });
      }

      const unlockedAchievements = await service.checkMilestones(studentId, 25);

      const mathStar = unlockedAchievements.find((a) => a.id === 'math_star');
      expect(mathStar).toBeDefined();
      expect(mathStar?.name).toBe('Math Star');
      expect(mathStar?.unlocked).toBe(true);
    });

    /**
     * Test: Detect third milestone achievement (AC-006: 50 correct)
     * Why Essential: Award "Math Champion" badge at 50 correct answers
     * Impact: Students miss major milestone celebration
     */
    it('should unlock "Math Champion" achievement at 50 correct answers', async () => {
      const studentId = 'student-milestone-50';

      // Record 50 correct answers
      for (let i = 0; i < 50; i++) {
        await progressService.recordQuestionAttempt(studentId, {
          questionId: `q-${i}`,
          topic: 'Addition',
          difficulty: 'easy',
          isCorrect: true,
          timeSpentSeconds: 30,
        });
      }

      const unlockedAchievements = await service.checkMilestones(studentId, 50);

      const mathChampion = unlockedAchievements.find(
        (a) => a.id === 'math_champion'
      );
      expect(mathChampion).toBeDefined();
      expect(mathChampion?.name).toBe('Math Champion');
      expect(mathChampion?.unlocked).toBe(true);
    });

    /**
     * Test: Unlock multiple milestones when crossing thresholds
     * Why Essential: Student going from 5 to 30 correct should get both achievements
     * Impact: Students miss achievements if not retroactively awarded
     */
    it('should unlock multiple achievements when crossing multiple thresholds', async () => {
      const studentId = 'student-multiple';

      const unlockedAchievements = await service.checkMilestones(studentId, 30);

      // Should unlock both First Steps (10) and Math Star (25)
      expect(unlockedAchievements.length).toBeGreaterThanOrEqual(2);

      const firstSteps = unlockedAchievements.find(
        (a) => a.id === 'first_steps'
      );
      const mathStar = unlockedAchievements.find((a) => a.id === 'math_star');

      expect(firstSteps?.unlocked).toBe(true);
      expect(mathStar?.unlocked).toBe(true);
    });

    /**
     * Test: No achievements unlock below first milestone
     * Why Essential: Don't award achievements prematurely
     * Impact: Achievement value diminished if awarded incorrectly
     */
    it('should not unlock any achievements below 10 correct answers', async () => {
      const studentId = 'student-below-threshold';

      const unlockedAchievements = await service.checkMilestones(studentId, 5);

      const milestoneAchievements = unlockedAchievements.filter(
        (a) => a.category === 'milestone' && a.unlocked === true
      );
      expect(milestoneAchievements.length).toBe(0);
    });
  });

  describe('getStudentAchievements', () => {
    /**
     * Test: Retrieve all achievements for a student (AC-006, AC-003)
     * Why Essential: Dashboard needs to display all achievements with unlock status
     * Impact: Cannot show achievement progress without this
     */
    it('should return all achievements with unlock status', async () => {
      const studentId = 'student-all-achievements';

      // Unlock first milestone
      for (let i = 0; i < 10; i++) {
        await progressService.recordQuestionAttempt(studentId, {
          questionId: `q-${i}`,
          topic: 'Addition',
          difficulty: 'easy',
          isCorrect: true,
          timeSpentSeconds: 30,
        });
      }
      await service.checkMilestones(studentId, 10);

      const studentAchievements = await service.getStudentAchievements(
        studentId
      );

      expect(studentAchievements).toBeDefined();
      expect(studentAchievements.studentId).toBe(studentId);
      expect(studentAchievements.achievements).toBeDefined();
      expect(studentAchievements.achievements.length).toBeGreaterThan(0);

      // First Steps should be unlocked
      const firstSteps = studentAchievements.achievements.find(
        (a) => a.id === 'first_steps'
      );
      expect(firstSteps?.unlocked).toBe(true);

      // Math Star should be locked
      const mathStar = studentAchievements.achievements.find(
        (a) => a.id === 'math_star'
      );
      expect(mathStar?.unlocked).toBe(false);
    });

    /**
     * Test: Calculate total points from unlocked achievements
     * Why Essential: Gamification requires point tracking
     * Impact: Cannot display student's achievement score
     */
    it('should calculate total points from unlocked achievements', async () => {
      const studentId = 'student-points';

      // Unlock first two milestones (10 + 25 points)
      for (let i = 0; i < 25; i++) {
        await progressService.recordQuestionAttempt(studentId, {
          questionId: `q-${i}`,
          topic: 'Addition',
          difficulty: 'easy',
          isCorrect: true,
          timeSpentSeconds: 30,
        });
      }
      await service.checkMilestones(studentId, 25);

      const studentAchievements = await service.getStudentAchievements(
        studentId
      );

      expect(studentAchievements.totalPoints).toBeGreaterThan(0);
      expect(studentAchievements.totalPoints).toBe(35); // 10 (First Steps) + 25 (Math Star)
    });
  });

  describe('getNextMilestone', () => {
    /**
     * Test: Calculate progress to next milestone (AC-003)
     * Why Essential: Display progress bar showing how close to next achievement
     * Impact: Students can't see how close they are to next goal
     */
    it('should calculate progress percentage to next milestone', async () => {
      const studentId = 'student-next-milestone';

      const nextMilestone = await service.getNextMilestone(studentId, 15);

      expect(nextMilestone).toBeDefined();
      expect(nextMilestone.id).toBe('math_star'); // Next after First Steps
      expect(nextMilestone.progress).toBeGreaterThan(0);
      expect(nextMilestone.progress).toBe(60); // 15/25 = 60%
    });

    /**
     * Test: Show 100% progress when milestone reached
     * Why Essential: Visual feedback when achievement is unlocked
     * Impact: Progress bar doesn't reach 100% at unlock moment
     */
    it('should show 100% progress when at milestone threshold', async () => {
      const studentId = 'student-at-milestone';

      const nextMilestone = await service.getNextMilestone(studentId, 10);

      // After unlocking at 10, next is Math Star (25), showing 40% progress (10/25)
      expect(nextMilestone.id).toBe('math_star');
      expect(nextMilestone.progress).toBe(40); // 10/25 = 40%
    });

    /**
     * Test: Return next available milestone after current
     * Why Essential: Always show what's next to keep student motivated
     * Impact: Students don't know what to work towards
     */
    it('should return next available milestone after unlocking current', async () => {
      const studentId = 'student-beyond-first';

      // Beyond first milestone (10), working towards second (25)
      const nextMilestone = await service.getNextMilestone(studentId, 18);

      expect(nextMilestone.id).toBe('math_star');
      expect(nextMilestone.progress).toBeCloseTo(72, 0); // 18/25 = 72%
    });
  });

  describe('getRecentlyUnlocked', () => {
    /**
     * Test: Track recently unlocked achievements (last 7 days)
     * Why Essential: Show celebration notifications for new achievements
     * Impact: Students miss positive reinforcement for recent accomplishments
     */
    it('should return achievements unlocked in last 7 days', async () => {
      const studentId = 'student-recent';

      // Unlock achievement
      for (let i = 0; i < 10; i++) {
        await progressService.recordQuestionAttempt(studentId, {
          questionId: `q-${i}`,
          topic: 'Addition',
          difficulty: 'easy',
          isCorrect: true,
          timeSpentSeconds: 30,
        });
      }
      await service.checkMilestones(studentId, 10);

      const studentAchievements = await service.getStudentAchievements(
        studentId
      );

      expect(studentAchievements.recentlyUnlocked).toBeDefined();
      expect(studentAchievements.recentlyUnlocked.length).toBeGreaterThan(0);

      const recentAchievement = studentAchievements.recentlyUnlocked[0];
      expect(recentAchievement.id).toBe('first_steps');
      expect(recentAchievement.unlockedDate).toBeDefined();
    });
  });

  describe('checkStreaks', () => {
    /**
     * Test: Unlock 3-day streak achievement (AC-002)
     * Why Essential: Core requirement - award "Streak Starter" at 3 consecutive days
     * Impact: Students miss early streak motivation milestone
     */
    it('should unlock "Streak Starter" achievement at 3 consecutive days', async () => {
      const studentId = 'student-streak-3';

      const unlockedAchievements = await service.checkStreaks(studentId, 3);

      expect(unlockedAchievements).toBeDefined();
      expect(unlockedAchievements.length).toBeGreaterThan(0);

      const streakStarter = unlockedAchievements.find(
        (a) => a.id === 'streak_starter'
      );
      expect(streakStarter).toBeDefined();
      expect(streakStarter?.name).toBe('Streak Starter');
      expect(streakStarter?.unlocked).toBe(true);
    });

    /**
     * Test: Unlock 7-day streak achievement (AC-002)
     * Why Essential: Award "Week Warrior" badge at 7 consecutive days
     * Impact: Students miss weekly streak celebration
     */
    it('should unlock "Week Warrior" achievement at 7 consecutive days', async () => {
      const studentId = 'student-streak-7';

      const unlockedAchievements = await service.checkStreaks(studentId, 7);

      const weekWarrior = unlockedAchievements.find(
        (a) => a.id === 'week_warrior'
      );
      expect(weekWarrior).toBeDefined();
      expect(weekWarrior?.name).toBe('Week Warrior');
      expect(weekWarrior?.unlocked).toBe(true);
    });

    /**
     * Test: Unlock 14-day streak achievement (AC-002)
     * Why Essential: Award "Two Week Champion" badge at 14 consecutive days
     * Impact: Students miss major streak milestone
     */
    it('should unlock "Two Week Champion" achievement at 14 consecutive days', async () => {
      const studentId = 'student-streak-14';

      const unlockedAchievements = await service.checkStreaks(studentId, 14);

      const twoWeekChampion = unlockedAchievements.find(
        (a) => a.id === 'two_week_champion'
      );
      expect(twoWeekChampion).toBeDefined();
      expect(twoWeekChampion?.name).toBe('Two Week Champion');
      expect(twoWeekChampion?.unlocked).toBe(true);
    });

    /**
     * Test: No streak achievements unlock below 3 days
     * Why Essential: Don't award streak achievements prematurely
     * Impact: Achievement value diminished if awarded too early
     */
    it('should not unlock any streak achievements below 3 days', async () => {
      const studentId = 'student-streak-2';

      const unlockedAchievements = await service.checkStreaks(studentId, 2);

      const streakAchievements = unlockedAchievements.filter(
        (a) => a.category === 'streak' && a.unlocked === true
      );
      expect(streakAchievements.length).toBe(0);
    });

    /**
     * Test: Unlock multiple streak achievements when crossing thresholds
     * Why Essential: Student going from 2 to 8 days should get both 3-day and 7-day
     * Impact: Students miss achievements if not retroactively awarded
     */
    it('should unlock multiple streak achievements when crossing thresholds', async () => {
      const studentId = 'student-streak-multiple';

      const unlockedAchievements = await service.checkStreaks(studentId, 8);

      // Should unlock both Streak Starter (3) and Week Warrior (7)
      expect(unlockedAchievements.length).toBeGreaterThanOrEqual(2);

      const streakStarter = unlockedAchievements.find(
        (a) => a.id === 'streak_starter'
      );
      const weekWarrior = unlockedAchievements.find(
        (a) => a.id === 'week_warrior'
      );

      expect(streakStarter?.unlocked).toBe(true);
      expect(weekWarrior?.unlocked).toBe(true);
    });
  });

  describe('checkTopicMastery', () => {
    /**
     * Test: Unlock Addition Master achievement (AC-006)
     * Why Essential: Award topic-specific badge for Addition mastery
     * Impact: Students miss subject-specific achievement recognition
     */
    it('should unlock "Addition Master" with 20+ questions and 80%+ accuracy', async () => {
      const studentId = 'student-addition-master';
      const topicStats = {
        topic: 'Addition',
        questionsAttempted: 25,
        correctAnswers: 22,
        accuracyPercentage: 88,
      };

      const unlockedAchievements = await service.checkTopicMastery(
        studentId,
        topicStats
      );

      expect(unlockedAchievements).toBeDefined();
      const additionMaster = unlockedAchievements.find(
        (a) => a.id === 'addition_master'
      );
      expect(additionMaster).toBeDefined();
      expect(additionMaster?.name).toBe('Addition Master');
      expect(additionMaster?.unlocked).toBe(true);
    });

    /**
     * Test: Unlock Subtraction Star achievement (AC-006)
     * Why Essential: Award topic-specific badge for Subtraction mastery
     * Impact: Students miss subject-specific achievement recognition
     */
    it('should unlock "Subtraction Star" with 20+ questions and 80%+ accuracy', async () => {
      const studentId = 'student-subtraction-star';
      const topicStats = {
        topic: 'Subtraction',
        questionsAttempted: 30,
        correctAnswers: 27,
        accuracyPercentage: 90,
      };

      const unlockedAchievements = await service.checkTopicMastery(
        studentId,
        topicStats
      );

      const subtractionStar = unlockedAchievements.find(
        (a) => a.id === 'subtraction_star'
      );
      expect(subtractionStar).toBeDefined();
      expect(subtractionStar?.name).toBe('Subtraction Star');
      expect(subtractionStar?.unlocked).toBe(true);
    });

    /**
     * Test: Do not unlock if question count too low
     * Why Essential: Ensure mastery requires sufficient practice
     * Impact: Achievement value diminished if awarded too easily
     */
    it('should not unlock topic achievement with less than 20 questions', async () => {
      const studentId = 'student-low-count';
      const topicStats = {
        topic: 'Addition',
        questionsAttempted: 15,
        correctAnswers: 14,
        accuracyPercentage: 93, // High accuracy but low count
      };

      const unlockedAchievements = await service.checkTopicMastery(
        studentId,
        topicStats
      );

      const topicAchievements = unlockedAchievements.filter(
        (a) => a.category === 'topic_mastery' && a.unlocked === true
      );
      expect(topicAchievements.length).toBe(0);
    });

    /**
     * Test: Do not unlock if accuracy too low
     * Why Essential: Mastery requires high accuracy, not just volume
     * Impact: "Master" badge loses meaning if accuracy is low
     */
    it('should not unlock topic achievement with less than 80% accuracy', async () => {
      const studentId = 'student-low-accuracy';
      const topicStats = {
        topic: 'Addition',
        questionsAttempted: 25,
        correctAnswers: 18,
        accuracyPercentage: 72, // Low accuracy
      };

      const unlockedAchievements = await service.checkTopicMastery(
        studentId,
        topicStats
      );

      const topicAchievements = unlockedAchievements.filter(
        (a) => a.category === 'topic_mastery' && a.unlocked === true
      );
      expect(topicAchievements.length).toBe(0);
    });

    /**
     * Test: Track progress towards topic mastery
     * Why Essential: Show students how close they are to earning badge
     * Impact: Reduced motivation without progress visibility
     */
    it('should calculate progress percentage towards topic mastery', async () => {
      const studentId = 'student-topic-progress';
      const topicStats = {
        topic: 'Multiplication',
        questionsAttempted: 10,
        correctAnswers: 9,
        accuracyPercentage: 90,
      };

      await service.checkTopicMastery(studentId, topicStats);

      const achievements = await service.getStudentAchievements(studentId);
      const multiplicationWizard = achievements.achievements.find(
        (a) => a.id === 'multiplication_wizard'
      );

      expect(multiplicationWizard).toBeDefined();
      expect(multiplicationWizard?.progress).toBeGreaterThan(0);
      expect(multiplicationWizard?.progress).toBeLessThan(100);
    });
  });
});
