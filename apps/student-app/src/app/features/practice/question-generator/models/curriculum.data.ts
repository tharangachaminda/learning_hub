/**
 * Frontend curriculum data for AI Question Generator controls.
 *
 * Mirrors the data from `api/src/app/ai/curriculum.types.ts` for
 * frontend consumption. Provides grade-topic mappings, question
 * categories, and display names needed by the generation controls.
 */

/**
 * Category metadata with display information for card rendering.
 *
 * @example
 * ```typescript
 * const cat: CategoryInfo = {
 *   name: 'Number Operations & Arithmetic',
 *   description: 'Fundamental computational skills.',
 *   icon: 'calculate',
 *   emoji: '🧮',
 * };
 * ```
 */
export interface CategoryInfo {
  /** Human-readable category name */
  name: string;
  /** One-line description for category card */
  description: string;
  /** Material Icon identifier */
  icon: string;
  /** Emoji for visual flair on category card */
  emoji: string;
}

/** Supported grade levels for the AI Question Generator. */
export const SUPPORTED_GRADES: number[] = [3, 4, 5, 6, 7, 8];

/**
 * Grade-based topic mappings for Mathematics (Grades 3–8).
 * Each grade contains a `mathematics` key with an array of topic keys.
 *
 * @example
 * ```typescript
 * const grade3Topics = GRADE_TOPICS[3].mathematics;
 * // ['ADDITION', 'SUBTRACTION', 'MULTIPLICATION', 'DIVISION', 'PATTERN_RECOGNITION']
 * ```
 */
export const GRADE_TOPICS: Record<number, Record<string, string[]>> = {
  3: {
    mathematics: [
      'ADDITION',
      'SUBTRACTION',
      'MULTIPLICATION',
      'DIVISION',
      'PATTERN_RECOGNITION',
    ],
  },
  4: {
    mathematics: [
      'ADDITION',
      'SUBTRACTION',
      'MULTIPLICATION',
      'DIVISION',
      'DECIMAL_BASICS',
      'FRACTION_BASICS',
      'PLACE_VALUE',
      'PATTERN_RECOGNITION',
      'SHAPE_PROPERTIES',
      'TIME_MEASUREMENT',
    ],
  },
  5: {
    mathematics: [
      'ADVANCED_ARITHMETIC',
      'ALGEBRAIC_THINKING',
      'DECIMAL_OPERATIONS',
      'FRACTION_OPERATIONS',
      'RATIO_PROPORTION',
    ],
  },
  6: {
    mathematics: [
      'LARGE_NUMBER_OPERATIONS',
      'ADVANCED_FRACTIONS_DECIMALS',
      'ALGEBRAIC_EQUATIONS',
      'ADVANCED_PATTERNS',
      'AREA_VOLUME_CALCULATIONS',
      'COORDINATE_GEOMETRY',
      'TRANSFORMATIONS_SYMMETRY',
      'MEASUREMENT_MASTERY',
      'DATA_ANALYSIS',
      'PROBABILITY_BASICS',
      'ADVANCED_PROBLEM_SOLVING',
      'MATHEMATICAL_REASONING',
      'REAL_WORLD_APPLICATIONS',
    ],
  },
  7: {
    mathematics: [
      'ADVANCED_NUMBER_OPERATIONS',
      'FRACTION_DECIMAL_MASTERY',
      'ALGEBRAIC_FOUNDATIONS',
      'GEOMETRY_SPATIAL_REASONING',
      'MULTI_UNIT_CONVERSIONS',
      'DATA_ANALYSIS_PROBABILITY',
    ],
  },
  8: {
    mathematics: [
      'PRIME_COMPOSITE_NUMBERS',
      'NEGATIVE_NUMBERS',
      'FRACTION_DECIMAL_PERCENTAGE',
      'NUMBER_PATTERNS',
      'LINEAR_EQUATIONS',
      'ALGEBRAIC_MANIPULATION',
      'PERIMETER_AREA_VOLUME',
      'UNIT_CONVERSIONS',
      'SPEED_CALCULATIONS',
      'RATIOS_PROPORTIONS',
      'FINANCIAL_LITERACY',
    ],
  },
};

/**
 * Question category definitions with display metadata for category cards.
 *
 * @example
 * ```typescript
 * const cat = QUESTION_CATEGORIES['number-operations'];
 * // { name: 'Number Operations & Arithmetic', ... }
 * ```
 */
export const QUESTION_CATEGORIES: Record<string, CategoryInfo> = {
  'number-operations': {
    name: 'Number Operations & Arithmetic',
    description:
      'Fundamental computational skills with whole numbers, fractions, decimals, and integers.',
    icon: 'calculate',
    emoji: '🧮',
  },
  'algebra-patterns': {
    name: 'Algebra & Patterns',
    description:
      'Algebraic thinking, pattern recognition, and abstract reasoning with variables and equations.',
    icon: 'functions',
    emoji: 'ƒ(x)',
  },
  'geometry-measurement': {
    name: 'Geometry & Measurement',
    description:
      'Spatial reasoning, shapes, measurements, coordinates, and geometric transformations.',
    icon: 'straighten',
    emoji: '📐',
  },
  'problem-solving-reasoning': {
    name: 'Problem Solving & Reasoning',
    description:
      'Multi-step problems and mathematical reasoning integrating multiple concepts.',
    icon: 'psychology',
    emoji: '🧠',
  },
};

/**
 * Human-readable display names for question type keys.
 * Used to populate the Topic dropdown with friendly labels.
 *
 * @example
 * ```typescript
 * const displayName = QUESTION_TYPE_DISPLAY_NAMES['ADDITION'];
 * // 'Addition'
 * ```
 */
export const QUESTION_TYPE_DISPLAY_NAMES: Record<string, string> = {
  // Grade 3–4: Number Operations
  ADDITION: 'Addition',
  SUBTRACTION: 'Subtraction',
  MULTIPLICATION: 'Multiplication',
  DIVISION: 'Division',
  DECIMAL_BASICS: 'Decimals (Basic)',
  DECIMAL_OPERATIONS: 'Decimal Operations',
  FRACTION_BASICS: 'Fractions (Basic)',
  FRACTION_OPERATIONS: 'Fraction Operations',

  // Grade 4: Additional topics
  PLACE_VALUE: 'Place Value',
  SHAPE_PROPERTIES: 'Shape Properties',
  TIME_MEASUREMENT: 'Time Measurement',

  // Grade 3–4: Patterns
  PATTERN_RECOGNITION: 'Pattern Recognition',

  // Grade 5: Advanced
  ADVANCED_ARITHMETIC: 'Advanced Arithmetic',
  ALGEBRAIC_THINKING: 'Algebraic Thinking',
  RATIO_PROPORTION: 'Ratio & Proportion',

  // Grade 6: Extended topics
  LARGE_NUMBER_OPERATIONS: 'Large Number Operations',
  ADVANCED_FRACTIONS_DECIMALS: 'Advanced Fractions & Decimals',
  ALGEBRAIC_EQUATIONS: 'Algebraic Equations',
  ADVANCED_PATTERNS: 'Advanced Patterns',
  AREA_VOLUME_CALCULATIONS: 'Area & Volume',
  COORDINATE_GEOMETRY: 'Coordinate Geometry',
  TRANSFORMATIONS_SYMMETRY: 'Transformations & Symmetry',
  MEASUREMENT_MASTERY: 'Measurement Mastery',
  DATA_ANALYSIS: 'Data Analysis',
  PROBABILITY_BASICS: 'Probability Basics',
  ADVANCED_PROBLEM_SOLVING: 'Advanced Problem Solving',
  MATHEMATICAL_REASONING: 'Mathematical Reasoning',
  REAL_WORLD_APPLICATIONS: 'Real World Applications',

  // Grade 7
  ADVANCED_NUMBER_OPERATIONS: 'Advanced Number Operations',
  FRACTION_DECIMAL_MASTERY: 'Fraction & Decimal Mastery',
  ALGEBRAIC_FOUNDATIONS: 'Algebraic Foundations',
  GEOMETRY_SPATIAL_REASONING: 'Geometry & Spatial Reasoning',
  MULTI_UNIT_CONVERSIONS: 'Multi-Unit Conversions',
  DATA_ANALYSIS_PROBABILITY: 'Data Analysis & Probability',

  // Grade 8
  PRIME_COMPOSITE_NUMBERS: 'Prime & Composite Numbers',
  NEGATIVE_NUMBERS: 'Negative Numbers',
  FRACTION_DECIMAL_PERCENTAGE: 'Fractions, Decimals & Percentages',
  NUMBER_PATTERNS: 'Number Patterns',
  LINEAR_EQUATIONS: 'Linear Equations',
  ALGEBRAIC_MANIPULATION: 'Algebraic Manipulation',
  PERIMETER_AREA_VOLUME: 'Perimeter, Area & Volume',
  UNIT_CONVERSIONS: 'Unit Conversions',
  SPEED_CALCULATIONS: 'Speed Calculations',
  RATIOS_PROPORTIONS: 'Ratios & Proportions',
  FINANCIAL_LITERACY: 'Financial Literacy',
};
