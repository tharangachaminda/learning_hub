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
  // Number Operations — Grades 3-4
  ADDITION: 'Addition',
  SUBTRACTION: 'Subtraction',
  MULTIPLICATION: 'Multiplication',
  DIVISION: 'Division',
  DECIMAL_BASICS: 'Decimals (Basic)',
  FRACTION_BASICS: 'Fractions (Basic)',
  PLACE_VALUE: 'Place Value',

  // Number Operations — Grade 5+
  ADVANCED_ARITHMETIC: 'Advanced Arithmetic',
  DECIMAL_OPERATIONS: 'Decimal Operations',
  FRACTION_OPERATIONS: 'Fraction Operations',
  RATIO_PROPORTION: 'Ratio & Proportion',

  // Number Operations — Grade 6+
  LARGE_NUMBER_OPERATIONS: 'Large Number Operations',
  ADVANCED_FRACTIONS_DECIMALS: 'Advanced Fractions & Decimals',

  // Number Operations — Grade 7+
  ADVANCED_NUMBER_OPERATIONS: 'Advanced Number Operations',
  FRACTION_DECIMAL_MASTERY: 'Fraction & Decimal Mastery',

  // Number Operations — Grade 8
  PRIME_COMPOSITE_NUMBERS: 'Prime & Composite Numbers',
  NEGATIVE_NUMBERS: 'Negative Numbers',
  FRACTION_DECIMAL_PERCENTAGE: 'Fractions, Decimals & Percentages',
  RATIOS_PROPORTIONS: 'Ratios & Proportions',
  FINANCIAL_LITERACY: 'Financial Literacy',

  // Patterns & Algebra — Grades 3-5
  PATTERN_RECOGNITION: 'Pattern Recognition',
  ALGEBRAIC_THINKING: 'Algebraic Thinking',

  // Algebra — Grade 6+
  ALGEBRAIC_EQUATIONS: 'Algebraic Equations',
  ADVANCED_PATTERNS: 'Advanced Patterns',

  // Algebra — Grade 7+
  ALGEBRAIC_FOUNDATIONS: 'Algebraic Foundations',
  NUMBER_PATTERNS: 'Number Patterns',
  LINEAR_EQUATIONS: 'Linear Equations',
  ALGEBRAIC_MANIPULATION: 'Algebraic Manipulation',

  // Geometry & Measurement — Grades 4-5
  SHAPE_PROPERTIES: 'Shape Properties',
  TIME_MEASUREMENT: 'Time Measurement',

  // Geometry & Measurement — Grade 6+
  AREA_VOLUME_CALCULATIONS: 'Area & Volume',
  COORDINATE_GEOMETRY: 'Coordinate Geometry',
  TRANSFORMATIONS_SYMMETRY: 'Transformations & Symmetry',
  MEASUREMENT_MASTERY: 'Measurement Mastery',

  // Geometry & Measurement — Grade 7+
  GEOMETRY_SPATIAL_REASONING: 'Geometry & Spatial Reasoning',
  MULTI_UNIT_CONVERSIONS: 'Multi-Unit Conversions',
  PERIMETER_AREA_VOLUME: 'Perimeter, Area & Volume',
  UNIT_CONVERSIONS: 'Unit Conversions',
  SPEED_CALCULATIONS: 'Speed Calculations',

  // Problem Solving & Data — Grade 6+
  DATA_ANALYSIS: 'Data Analysis',
  PROBABILITY_BASICS: 'Probability Basics',
  ADVANCED_PROBLEM_SOLVING: 'Advanced Problem Solving',
  MATHEMATICAL_REASONING: 'Mathematical Reasoning',
  REAL_WORLD_APPLICATIONS: 'Real-World Applications',
  DATA_ANALYSIS_PROBABILITY: 'Data Analysis & Probability',
};

/**
 * Maps question types to educational categories
 */
export const QUESTION_TYPE_TO_CATEGORY: Record<string, string> = {
  // Number Operations — basic arithmetic & number sense
  ADDITION: 'number-operations',
  SUBTRACTION: 'number-operations',
  MULTIPLICATION: 'number-operations',
  DIVISION: 'number-operations',
  DECIMAL_BASICS: 'number-operations',
  FRACTION_BASICS: 'number-operations',
  PLACE_VALUE: 'number-operations',
  ADVANCED_ARITHMETIC: 'number-operations',
  DECIMAL_OPERATIONS: 'number-operations',
  FRACTION_OPERATIONS: 'number-operations',
  RATIO_PROPORTION: 'number-operations',
  LARGE_NUMBER_OPERATIONS: 'number-operations',
  ADVANCED_FRACTIONS_DECIMALS: 'number-operations',
  ADVANCED_NUMBER_OPERATIONS: 'number-operations',
  FRACTION_DECIMAL_MASTERY: 'number-operations',
  PRIME_COMPOSITE_NUMBERS: 'number-operations',
  NEGATIVE_NUMBERS: 'number-operations',
  FRACTION_DECIMAL_PERCENTAGE: 'number-operations',
  RATIOS_PROPORTIONS: 'number-operations',
  FINANCIAL_LITERACY: 'number-operations',

  // Algebra & Patterns
  PATTERN_RECOGNITION: 'algebra-patterns',
  ALGEBRAIC_THINKING: 'algebra-patterns',
  ALGEBRAIC_EQUATIONS: 'algebra-patterns',
  ADVANCED_PATTERNS: 'algebra-patterns',
  ALGEBRAIC_FOUNDATIONS: 'algebra-patterns',
  NUMBER_PATTERNS: 'algebra-patterns',
  LINEAR_EQUATIONS: 'algebra-patterns',
  ALGEBRAIC_MANIPULATION: 'algebra-patterns',

  // Geometry & Measurement
  SHAPE_PROPERTIES: 'geometry-measurement',
  TIME_MEASUREMENT: 'geometry-measurement',
  AREA_VOLUME_CALCULATIONS: 'geometry-measurement',
  COORDINATE_GEOMETRY: 'geometry-measurement',
  TRANSFORMATIONS_SYMMETRY: 'geometry-measurement',
  MEASUREMENT_MASTERY: 'geometry-measurement',
  GEOMETRY_SPATIAL_REASONING: 'geometry-measurement',
  MULTI_UNIT_CONVERSIONS: 'geometry-measurement',
  PERIMETER_AREA_VOLUME: 'geometry-measurement',
  UNIT_CONVERSIONS: 'geometry-measurement',
  SPEED_CALCULATIONS: 'geometry-measurement',

  // Problem Solving, Data & Reasoning
  DATA_ANALYSIS: 'problem-solving-reasoning',
  PROBABILITY_BASICS: 'problem-solving-reasoning',
  ADVANCED_PROBLEM_SOLVING: 'problem-solving-reasoning',
  MATHEMATICAL_REASONING: 'problem-solving-reasoning',
  REAL_WORLD_APPLICATIONS: 'problem-solving-reasoning',
  DATA_ANALYSIS_PROBABILITY: 'problem-solving-reasoning',
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
