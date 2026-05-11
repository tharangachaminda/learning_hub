/**
 * Frontend display metadata used by the AI Question Generator.
 *
 * Runtime grade and topic options now come from the backend curriculum
 * endpoint. This file only keeps UI category metadata and fallback topic
 * labels for canonical and legacy topic keys.
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
 *
 * Backend curriculum labels are preferred at runtime. This map is only a
 * fallback for older records, tests, and any UI surface that still only has
 * a stored topic key.
 *
 * @example
 * ```typescript
 * const displayName = QUESTION_TYPE_DISPLAY_NAMES['WHOLE_NUMBER_OPERATIONS'];
 * // 'Whole Number Operations'
 * ```
 */
export const QUESTION_TYPE_DISPLAY_NAMES: Record<string, string> = {
  // Canonical backend curriculum topic labels.
  WHOLE_NUMBER_OPERATIONS: 'Whole Number Operations',
  FRACTIONS_DECIMALS_PERCENTAGES: 'Fractions, Decimals & Percentages',
  ALGEBRA_AND_PATTERNS: 'Algebra and Patterns',
  MEASUREMENT_AND_GEOMETRY: 'Measurement and Geometry',
  STATISTICS_AND_PROBABILITY: 'Statistics and Probability',
  RATIO_AND_PROPORTION: 'Ratio and Proportion',
  PROBLEM_SOLVING: 'Problem Solving',

  // Legacy practice topic display names retained for older question records.
  ADDITION: 'Addition',
  SUBTRACTION: 'Subtraction',
  MULTIPLICATION: 'Multiplication',
  DIVISION: 'Division',
  DECIMAL_BASICS: 'Decimals (Basic)',
  DECIMAL_OPERATIONS: 'Decimal Operations',
  FRACTION_BASICS: 'Fractions (Basic)',
  FRACTION_OPERATIONS: 'Fraction Operations',

  // Older grade-specific labels still referenced by existing questions.
  PLACE_VALUE: 'Place Value',
  SHAPE_PROPERTIES: 'Shape Properties',
  TIME_MEASUREMENT: 'Time Measurement',

  // Legacy pattern labels.
  PATTERN_RECOGNITION: 'Pattern Recognition',

  // Legacy upper-primary labels.
  ADVANCED_ARITHMETIC: 'Advanced Arithmetic',
  ALGEBRAIC_THINKING: 'Algebraic Thinking',
  RATIO_PROPORTION: 'Ratio & Proportion',

  // Legacy intermediate labels.
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

  // Legacy Year 7 labels.
  ADVANCED_NUMBER_OPERATIONS: 'Advanced Number Operations',
  FRACTION_DECIMAL_MASTERY: 'Fraction & Decimal Mastery',
  ALGEBRAIC_FOUNDATIONS: 'Algebraic Foundations',
  GEOMETRY_SPATIAL_REASONING: 'Geometry & Spatial Reasoning',
  MULTI_UNIT_CONVERSIONS: 'Multi-Unit Conversions',
  DATA_ANALYSIS_PROBABILITY: 'Data Analysis & Probability',

  // Legacy Year 8 labels.
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
