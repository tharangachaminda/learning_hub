import {
  validateLatexContent,
  extractLatexExpressions,
  LatexValidationResult,
} from './latex-validation.utils';

/**
 * Test Suite: LaTeX Validation Utility
 *
 * Purpose: Validate LaTeX content in AI-generated questions for KaTeX compatibility (REQ-QG-046)
 * Tests ensure malformed LaTeX is detected and valid LaTeX passes validation
 */
describe('LaTeX Validation Utils', () => {
  describe('extractLatexExpressions', () => {
    /**
     * Test: Extracts inline math from $...$ delimiters
     * Why Essential: Core functionality — must parse inline math for validation
     * What Breaks: Validation can't work if expressions aren't extracted
     */
    it('should extract inline math expressions from $...$ delimiters', () => {
      const text = 'What is $15 + 8$? Calculate $\\frac{3}{4}$ please.';
      const expressions = extractLatexExpressions(text);

      expect(expressions).toHaveLength(2);
      expect(expressions).toContain('15 + 8');
      expect(expressions).toContain('\\frac{3}{4}');
    });

    /**
     * Test: Extracts display math from $$...$$ delimiters
     * Why Essential: Must handle both inline and display math
     * What Breaks: Display math equations would skip validation
     */
    it('should extract display math expressions from $$...$$ delimiters', () => {
      const text = 'Solve: $$2x + 5 = 15$$ and also $$\\frac{6}{8}$$';
      const expressions = extractLatexExpressions(text);

      expect(expressions).toHaveLength(2);
      expect(expressions).toContain('2x + 5 = 15');
      expect(expressions).toContain('\\frac{6}{8}');
    });

    /**
     * Test: Handles mixed inline and display math
     * Why Essential: Real content often mixes both formats
     * What Breaks: Parser might confuse $$ delimiters with nested $ delimiters
     */
    it('should handle mixed inline and display math', () => {
      const text =
        'The answer to $5 + 3$ is $8$. In display mode: $$5 + 3 = 8$$';
      const expressions = extractLatexExpressions(text);

      expect(expressions.length).toBeGreaterThanOrEqual(3);
      expect(expressions).toContain('5 + 3');
      expect(expressions).toContain('8');
      expect(expressions).toContain('5 + 3 = 8');
    });

    /**
     * Test: Returns empty array for text with no LaTeX
     * Why Essential: Non-math text should not produce false extractions
     * What Breaks: Plain text might be misidentified as math
     */
    it('should return empty array for text with no LaTeX', () => {
      const text = 'Emma has 5 apples and buys 3 more.';
      const expressions = extractLatexExpressions(text);

      expect(expressions).toHaveLength(0);
    });
  });

  describe('validateLatexContent', () => {
    /**
     * Test: Valid simple LaTeX passes validation
     * Why Essential: AC-005 requires valid KaTeX-renderable content
     * What Breaks: Valid content might be incorrectly flagged as invalid
     */
    it('should validate simple LaTeX as valid', () => {
      const content = 'What is $15 + 8$?';
      const result = validateLatexContent(content);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.expressionCount).toBe(1);
    });

    /**
     * Test: Valid fraction LaTeX passes validation
     * Why Essential: Fractions are a core use case per AC-002
     * What Breaks: Correct \\frac notation flagged as invalid
     */
    it('should validate fraction LaTeX as valid', () => {
      const content = 'Simplify $\\frac{6}{8}$ to get $\\frac{3}{4}$.';
      const result = validateLatexContent(content);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.expressionCount).toBe(2);
    });

    /**
     * Test: Malformed LaTeX detected as invalid
     * Why Essential: REQ-QG-048 requires flagging invalid LaTeX for review
     * What Breaks: Malformed LaTeX rendered as garbage in frontend
     */
    it('should detect malformed LaTeX as invalid', () => {
      const content = 'Calculate $\\frac{3}{$';
      const result = validateLatexContent(content);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    /**
     * Test: Multiple expressions — all valid
     * Why Essential: Questions have math in question text, options, explanations
     * What Breaks: Partial validation might miss some expressions
     */
    it('should validate content with multiple valid expressions', () => {
      const content =
        'What is $\\frac{3}{4} + \\frac{1}{2}$? The answer is $\\frac{5}{4}$.';
      const result = validateLatexContent(content);

      expect(result.isValid).toBe(true);
      expect(result.expressionCount).toBe(2);
    });

    /**
     * Test: Mixed valid/invalid — overall invalid
     * Why Essential: Even one bad expression should flag the content
     * What Breaks: One good expression might mask a bad one
     */
    it('should flag content as invalid if any expression is malformed', () => {
      const content =
        'Good: $5 + 3 = 8$. Bad: $\\frac{3}{$';
      const result = validateLatexContent(content);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    /**
     * Test: Content with no LaTeX should be valid
     * Why Essential: Plain narrative text is allowed per AC-004
     * What Breaks: Non-math text flagged as "missing LaTeX"
     */
    it('should treat content with no LaTeX as valid', () => {
      const content = 'Emma went to the store to buy apples.';
      const result = validateLatexContent(content);

      expect(result.isValid).toBe(true);
      expect(result.expressionCount).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    /**
     * Test: Display math validation works
     * Why Essential: Display math uses $$...$$ and has different rendering
     * What Breaks: Only inline math gets validated
     */
    it('should validate display math expressions', () => {
      const content = 'Solve: $$2x + 5 = 15$$';
      const result = validateLatexContent(content);

      expect(result.isValid).toBe(true);
      expect(result.expressionCount).toBe(1);
    });

    /**
     * Test: Common KaTeX commands validate successfully
     * Why Essential: REQ-QG-045 specifies commands that must work
     * What Breaks: Standard commands rejected by validation
     */
    it('should validate common KaTeX commands', () => {
      const expressions = [
        '$\\frac{a}{b}$',
        '$a \\times b$',
        '$a \\div b$',
        '$x^{2}$',
        '$\\sqrt{16}$',
        '$5 \\text{ cm}$',
      ];

      expressions.forEach((expr) => {
        const result = validateLatexContent(expr);
        expect(result.isValid).toBe(true);
      });
    });
  });
});
