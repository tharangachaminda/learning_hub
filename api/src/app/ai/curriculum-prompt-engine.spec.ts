import {
  CurriculumPromptEngine,
  CurriculumPromptTemplate,
} from './curriculum-prompt-engine';
import { getCurriculumLevel } from './curriculum-knowledge.types';

/**
 * Test Suite: Curriculum-Aware Prompt Engine
 *
 * Purpose: Validate curriculum-aware prompt generation for AC-001, AC-002, AC-006
 * Tests ensure prompts include learning objectives, teaching methodologies, and curriculum alignment
 */
describe('CurriculumPromptEngine', () => {
  let engine: CurriculumPromptEngine;

  beforeEach(() => {
    engine = new CurriculumPromptEngine();
  });

  describe('generateCurriculumPrompt', () => {
    /**
     * Test: Prompt includes Level 2 Number learning objectives
     * Why Essential: Validates AC-001 requirement for referencing specific learning objectives
     * What Breaks: AI cannot generate curriculum-aligned questions without objective context
     */
    it('should generate prompt with Level 2 Number learning objectives', () => {
      const prompt = engine.generateCurriculumPrompt({
        grade: 3,
        topic: 'ADDITION',
        difficulty: 'medium',
        country: 'NZ',
      });

      expect(prompt).toBeDefined();
      expect(prompt.learningObjectives).toBeDefined();
      expect(prompt.learningObjectives.length).toBeGreaterThan(0);

      // Should include Level 2 Number objectives
      const objectiveIds = prompt.learningObjectives.map((obj) => obj.id);
      expect(objectiveIds.some((id) => id.startsWith('NUM-2.'))).toBe(true);

      // Prompt text should reference learning objectives
      expect(prompt.systemPrompt.toLowerCase()).toContain('learning objective');
    });

    /**
     * Test: Prompt includes NZ teaching methodologies
     * Why Essential: Validates AC-006 requirement for NZ teaching methodology alignment
     * What Breaks: Questions won't follow NZ educational approaches
     */
    it('should include NZ teaching methodologies in prompt', () => {
      const prompt = engine.generateCurriculumPrompt({
        grade: 3,
        topic: 'ADDITION',
        difficulty: 'medium',
        country: 'NZ',
      });

      expect(prompt.teachingMethodology).toBeDefined();
      expect(prompt.teachingMethodology.length).toBeGreaterThan(0);

      // Should include NZ-specific teaching methods
      const methodText = prompt.teachingMethodology.toLowerCase();
      expect(
        methodText.includes('concrete') ||
          methodText.includes('visual') ||
          methodText.includes('number line') ||
          methodText.includes('hands-on')
      ).toBe(true);

      // System prompt should mention teaching approaches
      expect(prompt.systemPrompt.toLowerCase()).toContain('teaching');
    });

    /**
     * Test: Prompt maps grade/topic to appropriate curriculum strand
     * Why Essential: Validates AC-002 requirement for curriculum strand alignment
     * What Breaks: Questions generated for wrong curriculum area
     */
    it('should map grade/topic to appropriate curriculum strand', () => {
      const prompt = engine.generateCurriculumPrompt({
        grade: 3,
        topic: 'ADDITION',
        difficulty: 'medium',
        country: 'NZ',
      });

      expect(prompt.curriculumStrand).toBeDefined();
      expect(prompt.curriculumStrand).toBe('Number');

      // Curriculum context should reference the strand
      expect(prompt.curriculumContext).toContain('Number');
    });

    /**
     * Test: Prompt includes assessment criteria
     * Why Essential: Ensures questions can be properly assessed per curriculum standards
     * What Breaks: Questions may not align with assessment requirements
     */
    it('should include assessment criteria in prompt guidance', () => {
      const prompt = engine.generateCurriculumPrompt({
        grade: 3,
        topic: 'ADDITION',
        difficulty: 'medium',
        country: 'NZ',
      });

      expect(prompt.assessmentGuidance).toBeDefined();
      expect(prompt.assessmentGuidance.length).toBeGreaterThan(0);

      // Should include assessment-related terms
      const assessmentText = prompt.assessmentGuidance.toLowerCase();
      expect(
        assessmentText.includes('accuracy') ||
          assessmentText.includes('strategy') ||
          assessmentText.includes('understanding')
      ).toBe(true);
    });

    it('should include curriculum level information', () => {
      const prompt = engine.generateCurriculumPrompt({
        grade: 3,
        topic: 'ADDITION',
        difficulty: 'medium',
        country: 'NZ',
      });

      expect(prompt.curriculumLevel).toBeDefined();
      expect(prompt.curriculumLevel).toBe(2); // Grade 3 = Level 2

      // System prompt should reference the curriculum level
      expect(prompt.systemPrompt).toContain('Level 2');
    });

    it('should include example questions from learning objectives', () => {
      const prompt = engine.generateCurriculumPrompt({
        grade: 3,
        topic: 'ADDITION',
        difficulty: 'medium',
        country: 'NZ',
      });

      expect(prompt.exampleQuestions).toBeDefined();
      expect(prompt.exampleQuestions).toBeInstanceOf(Array);
      expect(prompt.exampleQuestions.length).toBeGreaterThan(0);
    });

    it('should generate appropriate prompts for different topics', () => {
      const additionPrompt = engine.generateCurriculumPrompt({
        grade: 3,
        topic: 'ADDITION',
        difficulty: 'medium',
        country: 'NZ',
      });

      const subtractionPrompt = engine.generateCurriculumPrompt({
        grade: 3,
        topic: 'SUBTRACTION',
        difficulty: 'medium',
        country: 'NZ',
      });

      // Both should be Number strand but have different contexts
      expect(additionPrompt.curriculumStrand).toBe('Number');
      expect(subtractionPrompt.curriculumStrand).toBe('Number');

      // But prompts should be contextually different
      expect(additionPrompt.systemPrompt).not.toBe(
        subtractionPrompt.systemPrompt
      );
    });

    it('should handle Grade 4 (Level 2) appropriately', () => {
      const prompt = engine.generateCurriculumPrompt({
        grade: 4,
        topic: 'ADDITION',
        difficulty: 'medium',
        country: 'NZ',
      });

      expect(prompt.curriculumLevel).toBe(2); // Grade 4 is also Level 2
      expect(prompt.learningObjectives.length).toBeGreaterThan(0);
    });

    it('should include NZ cultural context in prompts', () => {
      const prompt = engine.generateCurriculumPrompt({
        grade: 3,
        topic: 'ADDITION',
        difficulty: 'medium',
        country: 'NZ',
      });

      // System prompt should include NZ context
      const promptText = prompt.systemPrompt.toLowerCase();
      expect(
        promptText.includes('new zealand') ||
          promptText.includes('aotearoa') ||
          promptText.includes('kiwi')
      ).toBe(true);
    });
  });

  describe('buildCurriculumContext', () => {
    it('should build comprehensive curriculum context string', () => {
      const prompt = engine.generateCurriculumPrompt({
        grade: 3,
        topic: 'ADDITION',
        difficulty: 'medium',
        country: 'NZ',
      });

      expect(prompt.curriculumContext).toBeDefined();
      expect(prompt.curriculumContext.length).toBeGreaterThan(50);

      // Should include key curriculum information
      expect(prompt.curriculumContext).toContain('Learning Objective');
      expect(prompt.curriculumContext).toContain('Number');
    });
  });

  describe('mapGradeToLevel', () => {
    it('should correctly map grades to curriculum levels', () => {
      // Grade 3-4 -> Level 2
      const level2Prompt = engine.generateCurriculumPrompt({
        grade: 3,
        topic: 'ADDITION',
        difficulty: 'medium',
        country: 'NZ',
      });
      expect(level2Prompt.curriculumLevel).toBe(2);

      // Grade 5-6 -> Level 3
      const level3Prompt = engine.generateCurriculumPrompt({
        grade: 5,
        topic: 'MULTIPLICATION',
        difficulty: 'medium',
        country: 'NZ',
      });
      expect(level3Prompt.curriculumLevel).toBe(3);
    });
  });

  describe('mapTopicToStrand', () => {
    it('should map arithmetic topics to Number strand', () => {
      const topics = ['ADDITION', 'SUBTRACTION', 'MULTIPLICATION', 'DIVISION'];

      topics.forEach((topic) => {
        const prompt = engine.generateCurriculumPrompt({
          grade: 3,
          topic,
          difficulty: 'medium',
          country: 'NZ',
        });

        expect(prompt.curriculumStrand).toBe('Number');
      });
    });

    it('should map pattern topics to Algebra strand', () => {
      const prompt = engine.generateCurriculumPrompt({
        grade: 3,
        topic: 'PATTERN_RECOGNITION',
        difficulty: 'medium',
        country: 'NZ',
      });

      expect(prompt.curriculumStrand).toBe('Algebra');
    });

    it('should map decimal and fraction topics to Number strand', () => {
      const topics = ['DECIMAL_BASICS', 'FRACTION_BASICS'];

      topics.forEach((topic) => {
        const prompt = engine.generateCurriculumPrompt({
          grade: 4,
          topic,
          difficulty: 'medium',
          country: 'NZ',
        });

        expect(prompt.curriculumStrand).toBe('Number');
      });
    });

    it('should map shape topics to Geometry strand', () => {
      const prompt = engine.generateCurriculumPrompt({
        grade: 4,
        topic: 'SHAPE_PROPERTIES',
        difficulty: 'medium',
        country: 'NZ',
      });

      expect(prompt.curriculumStrand).toBe('Geometry');
    });

    it('should map measurement topics to Measurement strand', () => {
      const prompt = engine.generateCurriculumPrompt({
        grade: 4,
        topic: 'TIME_MEASUREMENT',
        difficulty: 'medium',
        country: 'NZ',
      });

      expect(prompt.curriculumStrand).toBe('Measurement');
    });

    it('should default unknown topics to Number strand', () => {
      const prompt = engine.generateCurriculumPrompt({
        grade: 3,
        topic: 'UNKNOWN_TOPIC',
        difficulty: 'medium',
        country: 'NZ',
      });

      expect(prompt.curriculumStrand).toBe('Number');
    });
  });

  describe('LaTeX formatting rules', () => {
    /**
     * Test: System prompt includes LaTeX delimiter instructions
     * Why Essential: AC-001 requires all math expressions use $...$ or $$...$$ delimiters
     * What Breaks: AI won't produce LaTeX-wrapped math without explicit instructions
     */
    it('should include LaTeX delimiter instructions in system prompt', () => {
      const prompt = engine.generateCurriculumPrompt({
        grade: 3,
        topic: 'ADDITION',
        difficulty: 'medium',
        country: 'NZ',
      });

      const systemPrompt = prompt.systemPrompt;

      // Must instruct AI to use inline and display math delimiters
      expect(systemPrompt).toContain('$...$');
      expect(systemPrompt).toContain('$$...$$');
    });

    /**
     * Test: System prompt includes LaTeX command style guide
     * Why Essential: AC-002/AC-003 require proper LaTeX commands for fractions, multiplication, etc.
     * What Breaks: AI may use plain text math or non-KaTeX-compatible commands
     */
    it('should include LaTeX command style guide in system prompt', () => {
      const prompt = engine.generateCurriculumPrompt({
        grade: 5,
        topic: 'FRACTION_OPERATIONS',
        difficulty: 'medium',
        country: 'NZ',
      });

      const systemPrompt = prompt.systemPrompt;

      // Must include key LaTeX commands
      expect(systemPrompt).toContain('\\frac');
      expect(systemPrompt).toContain('\\times');
      expect(systemPrompt).toContain('\\div');
      expect(systemPrompt).toContain('\\sqrt');
      expect(systemPrompt).toContain('\\text');
    });

    /**
     * Test: System prompt includes LaTeX usage examples
     * Why Essential: AC-004 requires narrative text stays plain while math uses LaTeX
     * What Breaks: AI may inconsistently apply LaTeX or wrap non-math text in delimiters
     */
    it('should include LaTeX formatting examples in system prompt', () => {
      const prompt = engine.generateCurriculumPrompt({
        grade: 3,
        topic: 'ADDITION',
        difficulty: 'medium',
        country: 'NZ',
      });

      const systemPrompt = prompt.systemPrompt;

      // Must include at least one positive example with LaTeX
      expect(systemPrompt).toMatch(/\$\\frac\{/);
      // Must explicitly state mandatory formatting requirement
      expect(systemPrompt.toUpperCase()).toContain('MUST');
    });

    /**
     * Test: LaTeX rules are present for ALL grades and topics
     * Why Essential: AC-007 requires LaTeX works across all grades, topics, and formats
     * What Breaks: LaTeX instructions might only appear for specific grade/topic combos
     */
    it('should include LaTeX rules regardless of grade and topic', () => {
      const configs = [
        { grade: 3, topic: 'ADDITION' },
        { grade: 5, topic: 'FRACTION_OPERATIONS' },
        { grade: 6, topic: 'ALGEBRAIC_EQUATIONS' },
        { grade: 4, topic: 'MULTIPLICATION' },
      ];

      configs.forEach(({ grade, topic }) => {
        const prompt = engine.generateCurriculumPrompt({
          grade,
          topic,
          difficulty: 'medium',
          country: 'NZ',
        });

        expect(prompt.systemPrompt).toContain('$...$');
        expect(prompt.systemPrompt).toContain('$$...$$');
        expect(prompt.systemPrompt).toContain('\\frac');
      });
    });
  });

  describe('Question format rules by difficulty and grade', () => {
    const basicOps = ['ADDITION', 'SUBTRACTION', 'MULTIPLICATION', 'DIVISION'];

    /**
     * Test: Easy + basic ops + lower grades → simple numeric questions only
     * Why Essential: Young students at easy level need "$5 + 3 = ?$", not word problems
     * What Breaks: LLM generates confusing sentence-based questions for simple drills
     */
    it('should instruct simple numeric format for easy basic-op questions in grade 3-4', () => {
      basicOps.forEach((topic) => {
        [3, 4].forEach((grade) => {
          const prompt = engine.generateCurriculumPrompt({
            grade,
            topic,
            difficulty: 'easy',
            country: 'NZ',
          });

          expect(prompt.systemPrompt).toMatch(/simple.*numeric|numeric.*only/i);
          expect(prompt.systemPrompt).toMatch(
            /do NOT.*sentence|no.*word.*problem/i
          );
        });
      });
    });

    /**
     * Test: Medium/hard difficulty → sentence questions are allowed
     * Why Essential: Higher difficulty benefits from contextual word problems
     * What Breaks: All difficulties forced into plain numeric format
     */
    it('should allow sentence questions for medium and hard difficulty', () => {
      const prompt = engine.generateCurriculumPrompt({
        grade: 3,
        topic: 'ADDITION',
        difficulty: 'medium',
        country: 'NZ',
      });

      expect(prompt.systemPrompt).not.toMatch(
        /do NOT.*sentence|no.*word.*problem/i
      );
    });

    /**
     * Test: Higher grades (5+) easy → no restriction on sentence format
     * Why Essential: Older students handle word problems even at easy level
     * What Breaks: Grade 7 easy questions forced into "$5 + 3$" format
     */
    it('should not restrict question format for higher grades even at easy difficulty', () => {
      const prompt = engine.generateCurriculumPrompt({
        grade: 6,
        topic: 'ADDITION',
        difficulty: 'easy',
        country: 'NZ',
      });

      expect(prompt.systemPrompt).not.toMatch(
        /do NOT.*sentence|no.*word.*problem/i
      );
    });
  });

  describe('CurriculumPromptTemplate Interface', () => {
    it('should return complete prompt template structure', () => {
      const prompt = engine.generateCurriculumPrompt({
        grade: 3,
        topic: 'ADDITION',
        difficulty: 'medium',
        country: 'NZ',
      });

      // Validate all required fields are present
      expect(prompt.systemPrompt).toBeDefined();
      expect(prompt.curriculumContext).toBeDefined();
      expect(prompt.curriculumLevel).toBeDefined();
      expect(prompt.curriculumStrand).toBeDefined();
      expect(prompt.learningObjectives).toBeDefined();
      expect(prompt.teachingMethodology).toBeDefined();
      expect(prompt.assessmentGuidance).toBeDefined();
      expect(prompt.exampleQuestions).toBeDefined();

      // All should be non-empty
      expect(typeof prompt.systemPrompt).toBe('string');
      expect(prompt.systemPrompt.length).toBeGreaterThan(0);
      expect(typeof prompt.curriculumContext).toBe('string');
      expect(prompt.curriculumContext.length).toBeGreaterThan(0);
    });
  });
});
