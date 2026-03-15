import { MathQuestion, DifficultyLevel } from './math-question.entity';

describe('MathQuestion Entity', () => {
  describe('Constructor', () => {
    it('should create a MathQuestion with a string topic for operation', () => {
      // US-QG-004 REQ-QG-014/017: operation field accepts any topic string
      const mathQuestion = new MathQuestion(
        '5 + 3 = ?',
        8,
        'ADDITION',
        DifficultyLevel.GRADE_3,
        ['First add 5', 'Then add 3', 'Answer is 8']
      );

      expect(mathQuestion).toBeDefined();
      expect(mathQuestion.question).toBe('5 + 3 = ?');
      expect(mathQuestion.answer).toBe(8);
      expect(mathQuestion.operation).toBe('ADDITION');
      expect(mathQuestion.difficulty).toBe(DifficultyLevel.GRADE_3);
      expect(mathQuestion.stepByStepSolution).toEqual([
        'First add 5',
        'Then add 3',
        'Answer is 8',
      ]);
    });

    it('should accept any GRADE_TOPICS topic string as operation', () => {
      // US-QG-004 AC-006: All 50 grade×topic combinations supported
      const topicSamples = [
        'SUBTRACTION',
        'MULTIPLICATION',
        'DIVISION',
        'FRACTION_BASICS',
        'ALGEBRAIC_EQUATIONS',
        'FINANCIAL_LITERACY',
        'PATTERN_RECOGNITION',
      ];

      topicSamples.forEach((topic) => {
        const question = new MathQuestion(
          `Test question for ${topic}`,
          42,
          topic,
          DifficultyLevel.GRADE_3
        );
        expect(question.operation).toBe(topic);
      });
    });

    it('should validate required properties are provided', () => {
      // Testing validation - question and answer are mandatory
      expect(() => {
        new MathQuestion('', 5, 'ADDITION', DifficultyLevel.GRADE_3, []);
      }).toThrow('Question text cannot be empty');

      expect(() => {
        new MathQuestion(
          '2 + 2 = ?',
          null as any,
          'ADDITION',
          DifficultyLevel.GRADE_3,
          []
        );
      }).toThrow('Answer must be a valid number');
    });

    it('should have default values for optional properties', () => {
      // Testing that entity has sensible defaults
      const basicQuestion = new MathQuestion(
        '1 + 1 = ?',
        2,
        'ADDITION',
        DifficultyLevel.GRADE_3
      );

      expect(basicQuestion.stepByStepSolution).toEqual([]);
      expect(basicQuestion.createdAt).toBeInstanceOf(Date);
      expect(basicQuestion.id).toBeUndefined(); // Will be set by database
    });
  });

  describe('Enums', () => {
    it('should define DifficultyLevel enum with Grade 3 level', () => {
      expect(DifficultyLevel.GRADE_3).toBeDefined();
    });

    it('should define DifficultyLevel enum with all grades 3–8', () => {
      // US-QG-003 AC-001: System supports difficulty values grade_3 through grade_8
      expect(DifficultyLevel.GRADE_3).toBe('grade_3');
      expect(DifficultyLevel.GRADE_4).toBe('grade_4');
      expect(DifficultyLevel.GRADE_5).toBe('grade_5');
      expect(DifficultyLevel.GRADE_6).toBe('grade_6');
      expect(DifficultyLevel.GRADE_7).toBe('grade_7');
      expect(DifficultyLevel.GRADE_8).toBe('grade_8');
    });

    it('should have exactly 6 difficulty levels for grades 3–8', () => {
      const values = Object.values(DifficultyLevel);
      expect(values).toHaveLength(6);
      expect(values).toEqual(
        expect.arrayContaining([
          'grade_3',
          'grade_4',
          'grade_5',
          'grade_6',
          'grade_7',
          'grade_8',
        ])
      );
    });
  });

  describe('MathQuestion with different topics and grades', () => {
    it('should create a MathQuestion with FRACTION_BASICS for Grade 4', () => {
      // US-QG-004 AC-001: Topics from GRADE_TOPICS work for their grade
      const question = new MathQuestion(
        'What is $\\frac{1}{2} + \\frac{1}{4}$?',
        0.75,
        'FRACTION_BASICS',
        DifficultyLevel.GRADE_4,
        ['Find common denominator', 'Add numerators', 'Answer is 3/4']
      );

      expect(question.operation).toBe('FRACTION_BASICS');
      expect(question.difficulty).toBe(DifficultyLevel.GRADE_4);
    });

    it('should create a MathQuestion with ALGEBRAIC_EQUATIONS for Grade 6', () => {
      // US-QG-004 AC-006: Support all grade×topic combinations
      const question = new MathQuestion(
        'Solve: $2x + 5 = 15$',
        5,
        'ALGEBRAIC_EQUATIONS',
        DifficultyLevel.GRADE_6,
        ['Subtract 5 from both sides', 'Divide by 2', 'x = 5']
      );

      expect(question.operation).toBe('ALGEBRAIC_EQUATIONS');
      expect(question.difficulty).toBe(DifficultyLevel.GRADE_6);
    });

    it('should create a MathQuestion with FINANCIAL_LITERACY for Grade 8', () => {
      // US-QG-004 AC-006: Support Grade 8 topics including financial literacy
      const question = new MathQuestion(
        'If an item costs $45.00 NZD with 15% GST, what is the total?',
        51.75,
        'FINANCIAL_LITERACY',
        DifficultyLevel.GRADE_8,
        ['Calculate 15% of $45', 'Add GST to original', 'Total is $51.75']
      );

      expect(question.operation).toBe('FINANCIAL_LITERACY');
      expect(question.difficulty).toBe(DifficultyLevel.GRADE_8);
    });

    it('should create a MathQuestion with Grade 5 difficulty', () => {
      const question = new MathQuestion(
        '$45 \\times 3 = ?$',
        135,
        'ADVANCED_ARITHMETIC',
        DifficultyLevel.GRADE_5,
        ['Multiply 45 by 3', 'Answer is 135']
      );

      expect(question.operation).toBe('ADVANCED_ARITHMETIC');
      expect(question.difficulty).toBe(DifficultyLevel.GRADE_5);
    });
  });
});
