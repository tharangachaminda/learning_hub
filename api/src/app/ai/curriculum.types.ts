/**
 * Curriculum Types and Data for AI Question Generation
 *
 * Comprehensive New Zealand Mathematics Curriculum data including:
 * - Subject and difficulty classifications
 * - Grade-based topic mappings (Grades 3-8)
 * - Category-based question type system
 * - Educational metadata for AI context
 */

export enum Subject {
  MATHEMATICS = 'mathematics',
  SCIENCE = 'science',
  ENGLISH = 'english',
  SOCIAL_STUDIES = 'social-studies',
  TECHNOLOGY = 'technology',
  GENERAL = 'general',
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum EnhancedDifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export enum LearningStyle {
  VISUAL = 'visual',
  AUDITORY = 'auditory',
  KINESTHETIC = 'kinesthetic',
  READING_WRITING = 'reading_writing',
}

/**
 * Category metadata interface for AI context
 */
export interface CategoryInfo {
  name: string;
  description: string;
  skillsFocus: string[];
  icon: string;
  curriculumStrand: string;
}

/**
 * Question category definitions with educational metadata
 */
export const QUESTION_CATEGORIES: Record<string, CategoryInfo> = {
  'number-operations': {
    name: 'Number Operations & Arithmetic',
    description:
      'Fundamental computational skills with whole numbers, fractions, decimals, and integers.',
    skillsFocus: [
      'Computational accuracy and speed',
      'Number sense and magnitude understanding',
      'Fraction/decimal/percentage conversions',
      'Working with negative numbers',
    ],
    icon: 'calculate',
    curriculumStrand: 'Number and Algebra',
  },
  'algebra-patterns': {
    name: 'Algebra & Patterns',
    description:
      'Algebraic thinking, pattern recognition, and abstract reasoning with variables and equations.',
    skillsFocus: [
      'Pattern recognition and prediction',
      'Abstract and symbolic thinking',
      'Equation solving techniques',
      'Variable manipulation',
    ],
    icon: 'functions',
    curriculumStrand: 'Number and Algebra',
  },
  'geometry-measurement': {
    name: 'Geometry & Measurement',
    description:
      'Spatial reasoning, shapes, measurements, coordinates, and geometric transformations.',
    skillsFocus: [
      'Spatial visualization and reasoning',
      'Measurement accuracy and estimation',
      'Coordinate system navigation',
      'Unit conversion proficiency',
    ],
    icon: 'straighten',
    curriculumStrand: 'Measurement and Geometry',
  },
  'problem-solving-reasoning': {
    name: 'Problem Solving & Reasoning',
    description:
      'Multi-step problems and mathematical reasoning integrating multiple concepts.',
    skillsFocus: [
      'Multi-step problem solving',
      'Logical reasoning and deduction',
      'Integration of multiple concepts',
      'Solution verification',
    ],
    icon: 'psychology',
    curriculumStrand: 'All Strands (Cross-Curricular)',
  },
};

/**
 * Grade-based topic mappings for Mathematics (Grades 3-8)
 * Maps to vector database question types organized by NZ Curriculum progression
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
 * Question type display names for user-friendly presentation
 */
export const QUESTION_TYPE_DISPLAY_NAMES: Record<string, string> = {
  // Number Operations (Grades 3-8)
  ADDITION: 'Addition',
  SUBTRACTION: 'Subtraction',
  MULTIPLICATION: 'Multiplication',
  DIVISION: 'Division',
  DECIMAL_BASICS: 'Decimals (Basic)',
  DECIMAL_OPERATIONS: 'Decimal Operations',
  FRACTION_BASICS: 'Fractions (Basic)',
  FRACTION_OPERATIONS: 'Fraction Operations',

  // Patterns & Algebra (Grades 3-8)
  PATTERN_RECOGNITION: 'Pattern Recognition',
  ALGEBRAIC_THINKING: 'Algebraic Thinking',
  ALGEBRAIC_EQUATIONS: 'Algebraic Equations',

  // Geometry & Measurement (Grades 4-8)
  SHAPE_PROPERTIES: 'Shape Properties',
  TIME_MEASUREMENT: 'Time Measurement',
  AREA_VOLUME_CALCULATIONS: 'Area & Volume',
};

/**
 * Maps question types to educational categories
 */
export const QUESTION_TYPE_TO_CATEGORY: Record<string, string> = {
  // Number Operations
  ADDITION: 'number-operations',
  SUBTRACTION: 'number-operations',
  MULTIPLICATION: 'number-operations',
  DIVISION: 'number-operations',
  DECIMAL_BASICS: 'number-operations',
  FRACTION_BASICS: 'number-operations',

  // Algebra & Patterns
  PATTERN_RECOGNITION: 'algebra-patterns',
  ALGEBRAIC_THINKING: 'algebra-patterns',
  ALGEBRAIC_EQUATIONS: 'algebra-patterns',

  // Geometry & Measurement
  SHAPE_PROPERTIES: 'geometry-measurement',
  TIME_MEASUREMENT: 'geometry-measurement',
  AREA_VOLUME_CALCULATIONS: 'geometry-measurement',
};

/**
 * Helper function to get educational context for AI prompts
 */
export function getCurriculumContext(
  grade: number,
  topic: string
): {
  category: CategoryInfo | null;
  skillsFocus: string[];
  ageContext: string;
  complexityLevel: string;
} {
  const categoryKey = QUESTION_TYPE_TO_CATEGORY[topic];
  const category = categoryKey ? QUESTION_CATEGORIES[categoryKey] : null;

  // Age-appropriate context
  const ageContext =
    grade <= 4
      ? 'early primary'
      : grade <= 6
      ? 'middle primary'
      : 'late primary';

  // Complexity guidance
  const complexityLevel =
    grade <= 4
      ? 'concrete and visual'
      : grade <= 6
      ? 'semi-abstract with examples'
      : 'abstract with real-world connections';

  return {
    category,
    skillsFocus: category?.skillsFocus || [],
    ageContext,
    complexityLevel,
  };
}
