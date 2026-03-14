import katex from 'katex';

/**
 * Result of validating LaTeX content in a text string
 */
export interface LatexValidationResult {
  /** Whether all LaTeX expressions in the content are valid KaTeX */
  isValid: boolean;

  /** Array of error messages for invalid expressions */
  errors: string[];

  /** Number of LaTeX expressions found in the content */
  expressionCount: number;
}

/**
 * Extracts all LaTeX expressions from a text string.
 * Parses both display math ($$...$$) and inline math ($...$) delimiters.
 *
 * @param text - Text containing LaTeX expressions with $...$ or $$...$$ delimiters
 * @returns Array of LaTeX expression strings (without delimiters)
 *
 * @example
 * ```typescript
 * const expressions = extractLatexExpressions('What is $15 + 8$?');
 * // Returns: ['15 + 8']
 *
 * const display = extractLatexExpressions('Solve: $$2x + 5 = 15$$');
 * // Returns: ['2x + 5 = 15']
 * ```
 */
export function extractLatexExpressions(text: string): string[] {
  const expressions: string[] = [];

  // Extract display math first ($$...$$) to avoid conflicts with inline ($...$)
  const displayMathRegex = /\$\$([\s\S]*?)\$\$/g;
  let match: RegExpExecArray | null;

  // Work with a copy for inline extraction after removing display math
  let remainingText = text;

  while ((match = displayMathRegex.exec(text)) !== null) {
    const expr = match[1].trim();
    if (expr.length > 0) {
      expressions.push(expr);
    }
  }

  // Remove display math from text before extracting inline math
  remainingText = text.replace(displayMathRegex, '');

  // Extract inline math ($...$)
  const inlineMathRegex = /\$((?:[^$\\]|\\.)+?)\$/g;

  while ((match = inlineMathRegex.exec(remainingText)) !== null) {
    const expr = match[1].trim();
    if (expr.length > 0) {
      expressions.push(expr);
    }
  }

  return expressions;
}

/**
 * Validates all LaTeX expressions in a text string for KaTeX compatibility.
 * Uses KaTeX's parser with throwOnError to detect malformed expressions.
 *
 * @param content - Text content potentially containing LaTeX expressions
 * @returns Validation result with validity status, errors, and expression count
 *
 * @example
 * ```typescript
 * // Valid content
 * const valid = validateLatexContent('What is $\\frac{3}{4}$?');
 * // { isValid: true, errors: [], expressionCount: 1 }
 *
 * // Invalid content
 * const invalid = validateLatexContent('Bad: $\\frac{3}{$');
 * // { isValid: false, errors: ['...parsing error...'], expressionCount: 1 }
 * ```
 */
export function validateLatexContent(content: string): LatexValidationResult {
  const expressions = extractLatexExpressions(content);
  const errors: string[] = [];

  for (const expr of expressions) {
    try {
      katex.renderToString(expr, { throwOnError: true });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      errors.push(`Invalid LaTeX "${expr}": ${errorMessage}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    expressionCount: expressions.length,
  };
}
