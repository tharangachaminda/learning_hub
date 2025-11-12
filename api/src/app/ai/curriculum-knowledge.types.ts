/**
 * NZ Curriculum Knowledge Base Types
 *
 * Comprehensive type definitions for New Zealand Mathematics Curriculum Level 2-3
 * Supports curriculum-aware AI prompt engineering and question generation
 */

/**
 * Represents a complete NZ Curriculum Level (1-4 for primary mathematics)
 *
 * @example
 * ```typescript
 * const level2: CurriculumLevel = {
 *   level: 2,
 *   yearGroups: [3, 4],
 *   description: 'Level 2 - Years 3-4',
 *   keyCompetencies: ['Thinking', 'Using language, symbols, and texts'],
 *   strands: [...]
 * };
 * ```
 */
export interface CurriculumLevel {
  /** Curriculum level number (1-4 for primary) */
  level: number;

  /** Year groups covered by this level (e.g., [3, 4] for Level 2) */
  yearGroups: number[];

  /** Description of the curriculum level */
  description: string;

  /** NZ Curriculum key competencies for this level */
  keyCompetencies: string[];

  /** Mathematical strands for this level */
  strands: CurriculumStrand[];
}

/**
 * Represents a mathematical strand within the NZ Curriculum
 * Five main strands: Number, Algebra, Geometry, Measurement, Statistics
 *
 * @example
 * ```typescript
 * const numberStrand: CurriculumStrand = {
 *   name: 'Number',
 *   learningObjectives: [...],
 *   progressionMap: [...]
 * };
 * ```
 */
export interface CurriculumStrand {
  /** Strand name (Number, Algebra, Geometry, Measurement, Statistics) */
  name: 'Number' | 'Algebra' | 'Geometry' | 'Measurement' | 'Statistics';

  /** Learning objectives within this strand */
  learningObjectives: LearningObjective[];

  /** Progression pathway through this strand */
  progressionMap: ProgressionIndicator[];
}

/**
 * Represents a specific learning objective within a curriculum strand
 *
 * @example
 * ```typescript
 * const objective: LearningObjective = {
 *   id: 'NUM-2.1',
 *   description: 'Use simple additive strategies with whole numbers',
 *   keywords: ['addition', 'subtraction', 'strategies'],
 *   prerequisites: ['NUM-1.2'],
 *   examples: ['7 + 5 = ?', 'Count on from larger number'],
 *   teachingMethods: ['concrete materials', 'number lines'],
 *   assessmentCriteria: ['accuracy', 'strategy selection']
 * };
 * ```
 */
export interface LearningObjective {
  /** Unique identifier (e.g., "NUM-2.1" for Number strand, Level 2, Objective 1) */
  id: string;

  /** Description of the learning objective */
  description: string;

  /** Keywords associated with this objective for AI context */
  keywords: string[];

  /** Prerequisite learning objective IDs */
  prerequisites: string[];

  /** Example questions or concepts for this objective */
  examples: string[];

  /** Recommended NZ teaching methods */
  teachingMethods: string[];

  /** Assessment criteria for mastery */
  assessmentCriteria: string[];
}

/**
 * Represents progression between learning objectives
 *
 * @example
 * ```typescript
 * const progression: ProgressionIndicator = {
 *   from: 'NUM-1.2',
 *   to: 'NUM-2.1',
 *   description: 'From single-digit to double-digit addition',
 *   estimatedMasteryTime: '4-6 weeks',
 *   masteryIndicators: ['Consistent accuracy', 'Strategy selection']
 * };
 * ```
 */
export interface ProgressionIndicator {
  /** Source learning objective ID */
  from: string;

  /** Target learning objective ID */
  to: string;

  /** Description of the progression step */
  description: string;

  /** Estimated time for mastery */
  estimatedMasteryTime: string;

  /** Indicators of mastery achievement */
  masteryIndicators?: string[];
}

/**
 * NZ-specific cultural context for question generation
 *
 * @example
 * ```typescript
 * const context: NZCulturalContext = {
 *   contexts: ['family', 'school', 'environment'],
 *   maoriPerspectives: ['whanau', 'kiwi birds'],
 *   pacificPerspectives: ['coconuts', 'community'],
 *   localReferences: ['rugby', 'All Blacks']
 * };
 * ```
 */
export interface NZCulturalContext {
  /** General context categories */
  contexts: Array<'family' | 'school' | 'community' | 'environment'>;

  /** Māori cultural perspectives and references */
  maoriPerspectives: string[];

  /** Pacific cultural perspectives and references */
  pacificPerspectives: string[];

  /** Local NZ references (sports, animals, places) */
  localReferences: string[];
}

/**
 * NZ Curriculum Levels 1-4 Data
 * Complete curriculum knowledge base for primary mathematics
 */
export const NZ_CURRICULUM_LEVELS: Record<number, CurriculumLevel> = {
  1: {
    level: 1,
    yearGroups: [1, 2],
    description: 'Level 1 - New Zealand Mathematics Curriculum (Years 1-2)',
    keyCompetencies: [
      'Thinking',
      'Using language, symbols, and texts',
      'Managing self',
      'Relating to others',
      'Participating and contributing',
    ],
    strands: [
      {
        name: 'Number',
        learningObjectives: [
          {
            id: 'NUM-1.1',
            description: 'Count to at least 20 and understand number order',
            keywords: ['counting', 'number order', 'sequence'],
            prerequisites: [],
            examples: ['Count objects 1-20', 'What comes after 15?'],
            teachingMethods: [
              'concrete materials',
              'hands-on counting',
              'visual aids',
            ],
            assessmentCriteria: ['counting accuracy', 'number recognition'],
          },
          {
            id: 'NUM-1.2',
            description: 'Solve simple addition and subtraction problems',
            keywords: ['addition', 'subtraction', 'basic operations'],
            prerequisites: ['NUM-1.1'],
            examples: ['3 + 2 = ?', '5 - 1 = ?'],
            teachingMethods: ['concrete objects', 'fingers', 'number lines'],
            assessmentCriteria: ['accuracy', 'understanding'],
          },
        ],
        progressionMap: [
          {
            from: 'NUM-1.1',
            to: 'NUM-1.2',
            description: 'From counting to basic operations',
            estimatedMasteryTime: '2-3 weeks',
            masteryIndicators: ['Confident counting', 'Number recognition'],
          },
        ],
      },
      {
        name: 'Algebra',
        learningObjectives: [],
        progressionMap: [],
      },
      {
        name: 'Geometry',
        learningObjectives: [],
        progressionMap: [],
      },
      {
        name: 'Measurement',
        learningObjectives: [],
        progressionMap: [],
      },
      {
        name: 'Statistics',
        learningObjectives: [],
        progressionMap: [],
      },
    ],
  },
  2: {
    level: 2,
    yearGroups: [3, 4],
    description: 'Level 2 - New Zealand Mathematics Curriculum (Years 3-4)',
    keyCompetencies: [
      'Thinking',
      'Using language, symbols, and texts',
      'Managing self',
      'Relating to others',
      'Participating and contributing',
    ],
    strands: [
      {
        name: 'Number',
        learningObjectives: [
          {
            id: 'NUM-2.1',
            description: 'Use simple additive strategies with whole numbers',
            keywords: ['addition', 'subtraction', 'counting', 'strategies'],
            prerequisites: ['NUM-1.2'],
            examples: [
              'Count on from larger number for 47 + 5',
              'Use doubles: 15 + 15 = 30',
              'Use number lines for visualization',
            ],
            teachingMethods: [
              'concrete materials',
              'number lines',
              'mental strategies',
              'visual representations',
            ],
            assessmentCriteria: [
              'accuracy',
              'strategy selection',
              'explanation of thinking',
            ],
          },
          {
            id: 'NUM-2.2',
            description: 'Know addition and subtraction facts to 20',
            keywords: ['number facts', 'recall', 'fluency', 'basic facts'],
            prerequisites: ['NUM-2.1'],
            examples: [
              '7 + 8 = ?',
              '15 - 7 = ?',
              'Quick recall without counting',
            ],
            teachingMethods: [
              'games',
              'practice activities',
              'patterns',
              'repeated retrieval',
            ],
            assessmentCriteria: ['speed', 'accuracy', 'retention'],
          },
          {
            id: 'NUM-2.3',
            description:
              'Solve problems with addition and subtraction within 100',
            keywords: ['problem solving', 'two-digit', 'word problems'],
            prerequisites: ['NUM-2.1', 'NUM-2.2'],
            examples: [
              'Emma has 47 apples and buys 25 more. How many now?',
              '68 - 32 = ?',
            ],
            teachingMethods: [
              'word problems',
              'real-world contexts',
              'visual models',
            ],
            assessmentCriteria: [
              'problem comprehension',
              'correct operation selection',
              'accurate calculation',
            ],
          },
        ],
        progressionMap: [
          {
            from: 'NUM-2.1',
            to: 'NUM-2.2',
            description: 'From strategy use to fact fluency',
            estimatedMasteryTime: '4-6 weeks',
            masteryIndicators: [
              'Consistent accuracy with strategies',
              'Growing speed in recall',
            ],
          },
          {
            from: 'NUM-2.2',
            to: 'NUM-2.3',
            description: 'From fact knowledge to problem solving',
            estimatedMasteryTime: '3-4 weeks',
            masteryIndicators: [
              'Automatic fact recall',
              'Confidence with larger numbers',
            ],
          },
        ],
      },
      {
        name: 'Algebra',
        learningObjectives: [
          {
            id: 'ALG-2.1',
            description: 'Identify and continue simple patterns',
            keywords: ['patterns', 'sequences', 'prediction'],
            prerequisites: [],
            examples: ['2, 4, 6, ?, ?', 'Red, Blue, Red, Blue, ?'],
            teachingMethods: [
              'concrete patterns',
              'visual patterns',
              'discussion',
            ],
            assessmentCriteria: [
              'pattern recognition',
              'continuation',
              'explanation',
            ],
          },
        ],
        progressionMap: [],
      },
      {
        name: 'Geometry',
        learningObjectives: [
          {
            id: 'GEO-2.1',
            description: 'Identify and describe common 2D and 3D shapes',
            keywords: ['shapes', '2D', '3D', 'properties'],
            prerequisites: [],
            examples: ['Square, circle, triangle', 'Cube, sphere, cylinder'],
            teachingMethods: [
              'hands-on exploration',
              'real objects',
              'drawing',
            ],
            assessmentCriteria: [
              'shape identification',
              'property description',
            ],
          },
        ],
        progressionMap: [],
      },
      {
        name: 'Measurement',
        learningObjectives: [
          {
            id: 'MEA-2.1',
            description: 'Use standard units for length, weight, and capacity',
            keywords: ['measurement', 'units', 'estimation'],
            prerequisites: [],
            examples: ['Measure in cm', 'Weigh in grams', 'Estimate lengths'],
            teachingMethods: [
              'hands-on measuring',
              'estimation games',
              'comparison',
            ],
            assessmentCriteria: [
              'appropriate unit selection',
              'accurate measuring',
            ],
          },
        ],
        progressionMap: [],
      },
      {
        name: 'Statistics',
        learningObjectives: [
          {
            id: 'STA-2.1',
            description: 'Collect and display simple data',
            keywords: ['data', 'graphs', 'collection'],
            prerequisites: [],
            examples: ['Tally charts', 'Simple bar graphs', 'Pictographs'],
            teachingMethods: [
              'data collection activities',
              'graphing',
              'interpretation',
            ],
            assessmentCriteria: ['data accuracy', 'appropriate display'],
          },
        ],
        progressionMap: [],
      },
    ],
  },
  3: {
    level: 3,
    yearGroups: [5, 6],
    description: 'Level 3 - New Zealand Mathematics Curriculum (Years 5-6)',
    keyCompetencies: [
      'Thinking',
      'Using language, symbols, and texts',
      'Managing self',
      'Relating to others',
      'Participating and contributing',
    ],
    strands: [
      {
        name: 'Number',
        learningObjectives: [
          {
            id: 'NUM-3.1',
            description: 'Use a range of multiplicative strategies',
            keywords: ['multiplication', 'division', 'strategies'],
            prerequisites: ['NUM-2.3'],
            examples: ['24 × 5 = ?', 'Use partitioning', 'Use place value'],
            teachingMethods: [
              'strategy teaching',
              'problem solving',
              'visual models',
            ],
            assessmentCriteria: ['strategy variety', 'efficiency', 'accuracy'],
          },
        ],
        progressionMap: [],
      },
      {
        name: 'Algebra',
        learningObjectives: [],
        progressionMap: [],
      },
      {
        name: 'Geometry',
        learningObjectives: [],
        progressionMap: [],
      },
      {
        name: 'Measurement',
        learningObjectives: [],
        progressionMap: [],
      },
      {
        name: 'Statistics',
        learningObjectives: [],
        progressionMap: [],
      },
    ],
  },
  4: {
    level: 4,
    yearGroups: [7, 8],
    description: 'Level 4 - New Zealand Mathematics Curriculum (Years 7-8)',
    keyCompetencies: [
      'Thinking',
      'Using language, symbols, and texts',
      'Managing self',
      'Relating to others',
      'Participating and contributing',
    ],
    strands: [
      {
        name: 'Number',
        learningObjectives: [
          {
            id: 'NUM-4.1',
            description:
              'Use proportional reasoning with fractions and decimals',
            keywords: ['fractions', 'decimals', 'ratios', 'proportions'],
            prerequisites: ['NUM-3.1'],
            examples: ['3/4 of 20 = ?', '0.5 × 80 = ?'],
            teachingMethods: [
              'visual models',
              'real-world problems',
              'pattern finding',
            ],
            assessmentCriteria: [
              'conceptual understanding',
              'application',
              'accuracy',
            ],
          },
        ],
        progressionMap: [],
      },
      {
        name: 'Algebra',
        learningObjectives: [],
        progressionMap: [],
      },
      {
        name: 'Geometry',
        learningObjectives: [],
        progressionMap: [],
      },
      {
        name: 'Measurement',
        learningObjectives: [],
        progressionMap: [],
      },
      {
        name: 'Statistics',
        learningObjectives: [],
        progressionMap: [],
      },
    ],
  },
};

/**
 * Retrieves curriculum level data by level number
 *
 * @param level - Curriculum level (1-4)
 * @returns CurriculumLevel data
 * @throws Error if level not found
 *
 * @example
 * ```typescript
 * const level2 = getCurriculumLevel(2);
 * console.log(level2.description); // "Level 2 - Years 3-4"
 * ```
 */
export function getCurriculumLevel(level: number): CurriculumLevel {
  const curriculumLevel = NZ_CURRICULUM_LEVELS[level];
  if (!curriculumLevel) {
    throw new Error(`Curriculum level ${level} not found. Valid levels: 1-4`);
  }
  return curriculumLevel;
}

/**
 * Retrieves learning objectives for a specific strand and level
 *
 * @param level - Curriculum level (1-4)
 * @param strandName - Strand name (Number, Algebra, etc.)
 * @returns Array of learning objectives
 *
 * @example
 * ```typescript
 * const objectives = getLearningObjectivesByStrand(2, 'Number');
 * console.log(objectives.length); // 3 (for Level 2 Number strand)
 * ```
 */
export function getLearningObjectivesByStrand(
  level: number,
  strandName: string
): LearningObjective[] {
  try {
    const curriculumLevel = getCurriculumLevel(level);
    const strand = curriculumLevel.strands.find((s) => s.name === strandName);
    return strand?.learningObjectives || [];
  } catch {
    return [];
  }
}

/**
 * Retrieves progression path for a learning objective
 *
 * @param objectiveId - Learning objective ID (e.g., "NUM-2.1")
 * @returns Array of progression indicators
 *
 * @example
 * ```typescript
 * const path = getProgressionPath('NUM-2.1');
 * console.log(path[0].to); // "NUM-2.2"
 * ```
 */
export function getProgressionPath(
  objectiveId: string
): ProgressionIndicator[] {
  // Extract level from objective ID (e.g., "NUM-2.1" -> 2)
  const levelMatch = objectiveId.match(/-(\d+)\./);
  if (!levelMatch) return [];

  const level = parseInt(levelMatch[1], 10);
  const curriculumLevel = NZ_CURRICULUM_LEVELS[level];
  if (!curriculumLevel) return [];

  // Find all progression paths involving this objective
  const progressions: ProgressionIndicator[] = [];

  curriculumLevel.strands.forEach((strand) => {
    strand.progressionMap.forEach((progression) => {
      if (progression.from === objectiveId || progression.to === objectiveId) {
        progressions.push(progression);
      }
    });
  });

  return progressions;
}
