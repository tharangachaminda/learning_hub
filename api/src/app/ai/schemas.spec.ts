import {
  GRADE_LEVEL_PATTERNS,
  getGradePatterns,
  getCountryContext,
  parseLLMResponse,
} from './schemas';

describe('GRADE_LEVEL_PATTERNS', () => {
  const expectedGrades = [
    'GRADE_3',
    'GRADE_4',
    'GRADE_5',
    'GRADE_6',
    'GRADE_7',
    'GRADE_8',
  ] as const;

  it('should have entries for all grades 3–8 (REQ-QG-011)', () => {
    // US-QG-003 REQ-QG-011: GRADE_LEVEL_PATTERNS has entries for grades 3–8
    const keys = Object.keys(GRADE_LEVEL_PATTERNS);
    expect(keys).toHaveLength(6);
    expectedGrades.forEach((grade) => {
      expect(GRADE_LEVEL_PATTERNS).toHaveProperty(grade);
    });
  });

  describe.each(expectedGrades)('%s', (gradeKey) => {
    it('should have vocabularyLevel property', () => {
      const pattern = GRADE_LEVEL_PATTERNS[gradeKey];
      expect(pattern.vocabularyLevel).toBeDefined();
      expect(typeof pattern.vocabularyLevel).toBe('string');
    });

    it('should have maxSyllablesPerWord as a positive number', () => {
      const pattern = GRADE_LEVEL_PATTERNS[gradeKey];
      expect(pattern.maxSyllablesPerWord).toBeDefined();
      expect(pattern.maxSyllablesPerWord).toBeGreaterThan(0);
    });

    it('should have targetSentenceLength as a positive number', () => {
      const pattern = GRADE_LEVEL_PATTERNS[gradeKey];
      expect(pattern.targetSentenceLength).toBeDefined();
      expect(pattern.targetSentenceLength).toBeGreaterThan(0);
    });

    it('should have non-empty encouragingPhrases array', () => {
      const pattern = GRADE_LEVEL_PATTERNS[gradeKey];
      expect(Array.isArray(pattern.encouragingPhrases)).toBe(true);
      expect(pattern.encouragingPhrases.length).toBeGreaterThan(0);
    });

    it('should have non-empty visualAidsKeywords array', () => {
      const pattern = GRADE_LEVEL_PATTERNS[gradeKey];
      expect(Array.isArray(pattern.visualAidsKeywords)).toBe(true);
      expect(pattern.visualAidsKeywords.length).toBeGreaterThan(0);
    });

    it('should have non-empty teachingApproaches array', () => {
      const pattern = GRADE_LEVEL_PATTERNS[gradeKey];
      expect(Array.isArray(pattern.teachingApproaches)).toBe(true);
      expect(pattern.teachingApproaches.length).toBeGreaterThan(0);
    });
  });

  describe('grade progression — vocabulary complexity increases', () => {
    const vocabOrder = ['simple', 'moderate', 'complex'] as const;

    it('should have simpler vocabulary for lower grades', () => {
      // Grade 3 should be simpler than or equal to Grade 8
      const g3Idx = vocabOrder.indexOf(
        GRADE_LEVEL_PATTERNS.GRADE_3
          .vocabularyLevel as (typeof vocabOrder)[number]
      );
      const g8Idx = vocabOrder.indexOf(
        GRADE_LEVEL_PATTERNS.GRADE_8
          .vocabularyLevel as (typeof vocabOrder)[number]
      );
      expect(g3Idx).toBeLessThanOrEqual(g8Idx);
    });

    it('should allow more syllables per word for higher grades', () => {
      expect(
        GRADE_LEVEL_PATTERNS.GRADE_3.maxSyllablesPerWord
      ).toBeLessThanOrEqual(GRADE_LEVEL_PATTERNS.GRADE_8.maxSyllablesPerWord);
    });

    it('should allow longer sentences for higher grades', () => {
      expect(
        GRADE_LEVEL_PATTERNS.GRADE_3.targetSentenceLength
      ).toBeLessThanOrEqual(GRADE_LEVEL_PATTERNS.GRADE_8.targetSentenceLength);
    });
  });
});

describe('getGradePatterns', () => {
  it('should return correct patterns for each grade 3–8', () => {
    for (let grade = 3; grade <= 8; grade++) {
      const patterns = getGradePatterns(grade);
      expect(patterns).toBeDefined();
      expect(patterns.vocabularyLevel).toBeDefined();
      expect(patterns.encouragingPhrases.length).toBeGreaterThan(0);
    }
  });

  it('should return GRADE_3 patterns for grade 3', () => {
    const patterns = getGradePatterns(3);
    expect(patterns).toEqual(GRADE_LEVEL_PATTERNS.GRADE_3);
  });

  it('should return GRADE_5 patterns for grade 5', () => {
    const patterns = getGradePatterns(5);
    expect(patterns).toEqual(GRADE_LEVEL_PATTERNS.GRADE_5);
  });

  it('should return GRADE_8 patterns for grade 8', () => {
    const patterns = getGradePatterns(8);
    expect(patterns).toEqual(GRADE_LEVEL_PATTERNS.GRADE_8);
  });

  it('should fallback to GRADE_3 for out-of-range grades', () => {
    const patterns = getGradePatterns(1);
    expect(patterns).toEqual(GRADE_LEVEL_PATTERNS.GRADE_3);
  });

  it('should fallback to GRADE_8 for grades above 8', () => {
    const patterns = getGradePatterns(10);
    expect(patterns).toEqual(GRADE_LEVEL_PATTERNS.GRADE_8);
  });
});

describe('getCountryContext', () => {
  it('should return NZ context by default', () => {
    const context = getCountryContext('NZ');
    expect(context.currency).toBe('dollars');
    expect(context.commonNames.length).toBeGreaterThan(0);
  });
});

describe('parseLLMResponse', () => {
  it('should parse a valid JSON response', () => {
    const raw =
      '{"question": "What is 5 + 3?", "answer": 8, "explanation": "Add five and three to get eight."}';
    const result = parseLLMResponse(raw);
    expect(result).not.toBeNull();
    expect(result?.answer).toBe(8);
  });

  it('should return null for unparseable response', () => {
    const result = parseLLMResponse('random gibberish');
    expect(result).toBeNull();
  });

  it('should parse JSON response containing LaTeX backslash commands', () => {
    // LLM returns JSON with LaTeX like \frac, \times, \sqrt which break JSON.parse
    // because \f = form feed, \t = tab, etc.
    const raw =
      '{"question": "What is $\\frac{3}{4} + \\frac{1}{2}$?", "answer": 1, "explanation": "Use $\\frac{3}{4} + \\frac{2}{4} = \\frac{5}{4}$"}';
    const result = parseLLMResponse(raw);
    expect(result).not.toBeNull();
    expect(result?.answer).toBe(1);
    expect(result?.question).toContain('\\frac');
  });

  it('should parse JSON where LLM outputs single-escaped LaTeX backslashes', () => {
    // LLM often outputs: {"question": "What is $\frac{1}{2}$?"}
    // where \f is NOT a valid JSON escape → must be sanitized
    const raw = String.raw`{"question": "What is $\frac{1}{2}$?", "answer": 0, "explanation": "The answer involves \times and \sqrt{4}"}`;
    const result = parseLLMResponse(raw);
    expect(result).not.toBeNull();
    expect(result?.question).toContain('frac');
  });
});
