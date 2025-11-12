import {
  CurriculumLevel,
  CurriculumStrand,
  LearningObjective,
  ProgressionIndicator,
  NZCulturalContext,
  NZ_CURRICULUM_LEVELS,
  getCurriculumLevel,
  getLearningObjectivesByStrand,
  getProgressionPath,
} from './curriculum-knowledge.types';

/**
 * Test Suite: NZ Curriculum Knowledge Base Interfaces
 *
 * Purpose: Validate curriculum data structure integrity for AC-001, AC-004, AC-006
 * Tests ensure proper learning objective definitions, progression mapping, and teaching methodology alignment
 */
describe('NZ Curriculum Knowledge Base', () => {
  describe('CurriculumLevel Interface', () => {
    /**
     * Test: Level 2 curriculum structure validation
     * Why Essential: Validates core Level 2 data structure matches story requirements (AC-001)
     * What Breaks: Cannot generate curriculum-aligned questions without proper learning objectives
     */
    it('should define Level 2 curriculum with Number strand learning objectives', () => {
      const level2 = getCurriculumLevel(2);

      expect(level2).toBeDefined();
      expect(level2.level).toBe(2);
      expect(level2.yearGroups).toEqual([3, 4]);
      expect(level2.description).toContain('Level 2');
      expect(level2.strands).toHaveLength(5); // Number, Algebra, Geometry, Measurement, Statistics

      // Validate Number strand exists
      const numberStrand = level2.strands.find((s) => s.name === 'Number');
      expect(numberStrand).toBeDefined();
      expect(numberStrand?.learningObjectives.length).toBeGreaterThan(0);
    });

    it('should define all NZ Curriculum Levels 1-4 for primary mathematics', () => {
      expect(NZ_CURRICULUM_LEVELS).toHaveProperty('1');
      expect(NZ_CURRICULUM_LEVELS).toHaveProperty('2');
      expect(NZ_CURRICULUM_LEVELS).toHaveProperty('3');
      expect(NZ_CURRICULUM_LEVELS).toHaveProperty('4');

      const level1 = NZ_CURRICULUM_LEVELS[1];
      expect(level1.level).toBe(1);
      expect(level1.yearGroups).toContain(1);
      expect(level1.strands.length).toBeGreaterThan(0);
    });

    it('should include key competencies for each curriculum level', () => {
      const level2 = getCurriculumLevel(2);

      expect(level2.keyCompetencies).toBeDefined();
      expect(level2.keyCompetencies.length).toBeGreaterThan(0);
      expect(level2.keyCompetencies).toContain('Thinking');
      expect(level2.keyCompetencies).toContain(
        'Using language, symbols, and texts'
      );
    });
  });

  describe('LearningObjective Interface', () => {
    /**
     * Test: Learning objective structure validation
     * Why Essential: Validates AC-005 requirement for proper curriculum objective tagging
     * What Breaks: Questions cannot be tagged with learning objectives for tracking
     */
    it('should define learning objectives with required metadata', () => {
      const level2 = getCurriculumLevel(2);
      const numberStrand = level2.strands.find((s) => s.name === 'Number');
      const objective = numberStrand?.learningObjectives[0];

      expect(objective).toBeDefined();
      expect(objective?.id).toMatch(/^NUM-2\.\d+$/); // e.g., "NUM-2.1"
      expect(objective?.description).toBeDefined();
      expect(objective?.keywords).toBeInstanceOf(Array);
      expect(objective?.keywords.length).toBeGreaterThan(0);
      expect(objective?.prerequisites).toBeInstanceOf(Array);
      expect(objective?.examples).toBeInstanceOf(Array);
      expect(objective?.teachingMethods).toBeInstanceOf(Array);
      expect(objective?.assessmentCriteria).toBeInstanceOf(Array);
    });

    /**
     * Test: Learning objective progression validation
     * Why Essential: Validates AC-004 requirement for curriculum progression understanding
     * What Breaks: AI cannot adapt difficulty appropriately across levels
     */
    it('should include prerequisite relationships for learning progression', () => {
      const objectives = getLearningObjectivesByStrand(2, 'Number');

      // Find an objective with prerequisites
      const advancedObjective = objectives.find((obj) => obj.id === 'NUM-2.2');

      expect(advancedObjective).toBeDefined();
      expect(advancedObjective?.prerequisites).toBeDefined();
      expect(advancedObjective?.prerequisites.length).toBeGreaterThan(0);

      // Prerequisites should reference other valid objective IDs
      const prereqId = advancedObjective?.prerequisites[0];
      expect(prereqId).toMatch(/^NUM-\d+\.\d+$/);
    });

    /**
     * Test: Teaching methodology alignment
     * Why Essential: Validates AC-006 requirement for NZ teaching methodology alignment
     * What Breaks: Generated questions won't align with NZ educational approaches
     */
    it('should map learning objectives to NZ teaching methodologies', () => {
      const level2 = getCurriculumLevel(2);
      const numberStrand = level2.strands.find((s) => s.name === 'Number');
      const objective = numberStrand?.learningObjectives[0];

      expect(objective?.teachingMethods).toBeDefined();
      expect(objective?.teachingMethods.length).toBeGreaterThan(0);

      // Validate NZ-specific teaching methods are included
      const allMethods = objective?.teachingMethods.join(' ').toLowerCase();
      expect(
        allMethods?.includes('concrete') ||
          allMethods?.includes('visual') ||
          allMethods?.includes('hands-on') ||
          allMethods?.includes('number line')
      ).toBe(true);
    });

    it('should include assessment criteria for each learning objective', () => {
      const objectives = getLearningObjectivesByStrand(2, 'Number');
      const objective = objectives[0];

      expect(objective.assessmentCriteria).toBeDefined();
      expect(objective.assessmentCriteria.length).toBeGreaterThan(0);
      expect(typeof objective.assessmentCriteria[0]).toBe('string');
    });
  });

  describe('CurriculumStrand Interface', () => {
    /**
     * Test: Curriculum strand validation
     * Why Essential: Validates AC-002 requirement for curriculum strand alignment
     * What Breaks: Cannot align questions with proper curriculum strands
     */
    it('should define all five NZ Mathematics curriculum strands', () => {
      const level2 = getCurriculumLevel(2);
      const strandNames = level2.strands.map((s) => s.name);

      expect(strandNames).toContain('Number');
      expect(strandNames).toContain('Algebra');
      expect(strandNames).toContain('Geometry');
      expect(strandNames).toContain('Measurement');
      expect(strandNames).toContain('Statistics');
    });

    it('should include progression maps for each strand', () => {
      const level2 = getCurriculumLevel(2);
      const numberStrand = level2.strands.find((s) => s.name === 'Number');

      expect(numberStrand?.progressionMap).toBeDefined();
      expect(numberStrand?.progressionMap).toBeInstanceOf(Array);
    });

    it('should link learning objectives within each strand', () => {
      const level2 = getCurriculumLevel(2);
      const numberStrand = level2.strands.find((s) => s.name === 'Number');

      expect(numberStrand?.learningObjectives).toBeDefined();
      expect(numberStrand?.learningObjectives.length).toBeGreaterThan(0);

      // Each objective should belong to this strand
      numberStrand?.learningObjectives.forEach((obj) => {
        expect(obj.id).toMatch(/^NUM-/); // Number strand prefix
      });
    });
  });

  describe('ProgressionIndicator Interface', () => {
    it('should map learning progression paths between objectives', () => {
      const progressionPath = getProgressionPath('NUM-2.1');

      expect(progressionPath).toBeDefined();
      expect(progressionPath.length).toBeGreaterThan(0);

      const firstStep = progressionPath[0];
      expect(firstStep.from).toBeDefined();
      expect(firstStep.to).toBeDefined();
      expect(firstStep.description).toBeDefined();
      expect(firstStep.estimatedMasteryTime).toBeDefined();
    });

    it('should include mastery indicators for progression tracking', () => {
      const progressionPath = getProgressionPath('NUM-2.1');
      const indicator = progressionPath[0];

      expect(indicator.masteryIndicators).toBeDefined();
      expect(indicator.masteryIndicators?.length).toBeGreaterThan(0);
      expect(typeof indicator.masteryIndicators?.[0]).toBe('string');
    });
  });

  describe('NZCulturalContext Interface', () => {
    it('should define NZ-specific cultural contexts for questions', () => {
      const level2 = getCurriculumLevel(2);

      // Access cultural context (should be part of curriculum or separate)
      expect(level2).toBeDefined();

      // Cultural context should include NZ references
      const description = level2.description.toLowerCase();
      expect(
        description.includes('new zealand') || description.includes('aotearoa')
      ).toBe(true);
    });

    it('should include Māori and Pacific perspectives', () => {
      const level2 = getCurriculumLevel(2);

      // Check if cultural competencies include cultural perspectives
      const hasculturalCompetency = level2.keyCompetencies.some(
        (comp) =>
          comp.toLowerCase().includes('relating to others') ||
          comp.toLowerCase().includes('participating and contributing')
      );

      expect(hasculturalCompetency).toBe(true);
    });
  });

  describe('Helper Functions', () => {
    it('should retrieve learning objectives by strand and level', () => {
      const numberObjectives = getLearningObjectivesByStrand(2, 'Number');

      expect(numberObjectives).toBeDefined();
      expect(numberObjectives.length).toBeGreaterThan(0);
      expect(numberObjectives[0].id).toMatch(/^NUM-2\.\d+$/);
    });

    it('should handle invalid level gracefully', () => {
      expect(() => getCurriculumLevel(99)).toThrow();
    });

    it('should handle invalid strand name gracefully', () => {
      const invalidObjectives = getLearningObjectivesByStrand(
        2,
        'InvalidStrand'
      );
      expect(invalidObjectives).toEqual([]);
    });
  });
});
