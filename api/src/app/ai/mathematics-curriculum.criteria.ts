import {
  CurriculumStrand,
  SubjectCurriculumDefinition,
  TopicDifficultyCriteria,
  CurriculumTopicDefinition,
} from './curriculum-criteria.types';

type TopicSeed = {
  key: string;
  label: string;
  strand: CurriculumStrand;
  overview: string;
  learningObjectives: string[];
  prerequisiteIdeas: string[];
  exampleContexts: string[];
  legacyTopicKeys?: string[];
};

const MATHEMATICS_SOURCE_PDF = 'dev_resources/-Mathematics–and–Statistics.pdf';
const MATHEMATICS_SOURCE_EXTRACT =
  'docs/technical/mathematics-statistics-curriculum-extract.md';

function buildDifficultyCriteria(
  year: number,
  strand: CurriculumStrand,
  assessmentCriteria: string[]
): Record<'easy' | 'medium' | 'hard', TopicDifficultyCriteria> {
  const phaseConstraint =
    year <= 3
      ? 'Use concrete, visual, or highly scaffolded contexts before abstract notation.'
      : year <= 6
      ? 'Allow symbolic work, but keep the problem anchored to representations or clear real-world context.'
      : year <= 8
      ? 'Require students to choose and justify methods using standard mathematical language.'
      : 'Expect generalisation across representations, including equations, graphs, and formal reasoning.';

  const easyForms =
    year <= 3
      ? ['visual prompt', 'one-step open-ended', 'guided short response']
      : [
          'one-step open-ended',
          'guided worked example',
          'short contextual prompt',
        ];
  const mediumForms =
    year <= 6
      ? ['two-step open-ended', 'word problem', 'multiple representation task']
      : ['multi-step open-ended', 'word problem', 'reasoning prompt'];
  const hardForms =
    year <= 3
      ? ['reasoning prompt', 'compare-and-explain task']
      : [
          'non-routine problem',
          'justify-your-strategy task',
          'error analysis prompt',
        ];

  const easySkills =
    year <= 3
      ? ['identify the mathematical idea', 'use one familiar representation']
      : ['apply a known method accurately', 'connect symbols to context'];
  const mediumSkills =
    year <= 6
      ? ['select an appropriate method', 'complete a short sequence of steps']
      : [
          'connect multiple representations',
          'reason about efficiency and validity',
        ];
  const hardSkills =
    year <= 8
      ? ['generalise a pattern or rule', 'justify the chosen strategy']
      : [
          'generalise across cases',
          'justify with algebraic or statistical reasoning',
        ];

  const representations =
    strand === 'Statistics' || strand === 'Probability'
      ? ['tables', 'charts', 'statements in context']
      : year <= 3
      ? ['materials', 'pictures', 'number lines']
      : year <= 6
      ? ['diagrams', 'tables', 'number lines', 'symbols']
      : ['symbols', 'tables', 'graphs', 'diagrams'];

  return {
    easy: {
      cognitiveDemand:
        'Recall and apply a familiar concept in a constrained setting.',
      allowedQuestionForms: easyForms,
      requiredSkills: easySkills,
      representations,
      constraints: [
        phaseConstraint,
        'Keep vocabulary and notation directly aligned to the taught year sequence.',
      ],
      assessmentCriteria,
    },
    medium: {
      cognitiveDemand:
        'Apply the concept in a slightly novel context with moderate reasoning.',
      allowedQuestionForms: mediumForms,
      requiredSkills: mediumSkills,
      representations,
      constraints: [
        phaseConstraint,
        'Require a correct method and a complete answer, not just a final value.',
      ],
      assessmentCriteria,
    },
    hard: {
      cognitiveDemand:
        'Transfer, justify, or generalise the concept in a less familiar setting.',
      allowedQuestionForms: hardForms,
      requiredSkills: hardSkills,
      representations,
      constraints: [
        phaseConstraint,
        'Include reasoning, justification, or error-checking expectations in the solution.',
      ],
      assessmentCriteria,
    },
  };
}

function defineTopic(year: number, seed: TopicSeed): CurriculumTopicDefinition {
  const assessmentCriteria = [
    `Matches the intended Year ${year} curriculum focus.`,
    `Assesses ${seed.strand.toLowerCase()} understanding rather than incidental reading complexity.`,
    'Produces an unambiguous answer with a solution that can be explained step by step.',
  ];

  return {
    ...seed,
    criteria: buildDifficultyCriteria(year, seed.strand, assessmentCriteria),
  };
}

const YEAR_TOPIC_SEEDS: Record<number, TopicSeed[]> = {
  0: [
    {
      key: 'COUNTING_AND_QUANTITY',
      label: 'Counting and Quantity',
      strand: 'Number',
      overview:
        'Develop early counting, number order, and quantity recognition with small collections.',
      learningObjectives: [
        'Recognise small quantities without counting each item.',
        'Count objects accurately with one-to-one correspondence.',
      ],
      prerequisiteIdeas: [
        'spoken number sequence',
        'matching objects to counts',
      ],
      exampleContexts: ['toys', 'classroom materials', 'family objects'],
    },
    {
      key: 'EARLY_OPERATIONS',
      label: 'Early Operations',
      strand: 'Number',
      overview:
        'Introduce joining and separating situations using concrete materials.',
      learningObjectives: [
        'Model simple addition as combining groups.',
        'Model simple subtraction as taking away or finding what remains.',
      ],
      prerequisiteIdeas: ['counting to 10', 'comparing more and less'],
      exampleContexts: ['snacks', 'blocks', 'playground groups'],
    },
    {
      key: 'EARLY_PATTERNING',
      label: 'Early Patterning',
      strand: 'Algebra',
      overview:
        'Notice, continue, and describe repeating patterns using actions, shapes, and objects.',
      learningObjectives: [
        'Identify what repeats in a simple pattern.',
        'Continue a pattern and explain the repeating unit.',
      ],
      prerequisiteIdeas: ['sorting', 'matching'],
      exampleContexts: ['bead strings', 'movement patterns', 'shape sequences'],
    },
    {
      key: 'COMPARING_AND_MEASURING',
      label: 'Comparing and Measuring',
      strand: 'Measurement',
      overview:
        'Compare length, mass, capacity, and time using informal language and non-standard units.',
      learningObjectives: [
        'Compare objects directly using language like longer, shorter, heavier, lighter.',
        'Use informal units to measure and describe attributes.',
      ],
      prerequisiteIdeas: ['comparison language', 'ordering'],
      exampleContexts: ['classroom objects', 'water play', 'daily routines'],
    },
    {
      key: 'SHAPES_AND_POSITION',
      label: 'Shapes and Position',
      strand: 'Geometry',
      overview:
        'Recognise common shapes and describe where objects are using positional language.',
      learningObjectives: [
        'Identify common 2D and 3D shapes in the environment.',
        'Use position words such as above, below, next to, and between.',
      ],
      prerequisiteIdeas: ['visual discrimination', 'directional language'],
      exampleContexts: ['classroom maps', 'building blocks', 'picture books'],
    },
  ],
  1: [
    {
      key: 'NUMBER_SEQUENCE_TO_100',
      label: 'Number Sequence to 100',
      strand: 'Number',
      overview:
        'Extend counting, place value, and ordering through two-digit numbers.',
      learningObjectives: [
        'Read, write, compare, and order whole numbers to 100.',
        'Connect two-digit numbers to tens and ones.',
      ],
      prerequisiteIdeas: ['counting to 20', 'one-to-one correspondence'],
      exampleContexts: ['collections', 'games', 'calendar counts'],
    },
    {
      key: 'ADD_SUB_WITHIN_20',
      label: 'Addition and Subtraction Within 20',
      strand: 'Number',
      overview:
        'Use known facts, doubles, and concrete representations for early additive reasoning.',
      learningObjectives: [
        'Solve one-step addition and subtraction problems within 20.',
        'Use doubles, halves, and near-doubles to support calculation.',
      ],
      prerequisiteIdeas: ['counting on', 'part-whole thinking'],
      exampleContexts: ['stories', 'objects', 'tens frames'],
    },
    {
      key: 'PATTERNS_AND_EQUALITY',
      label: 'Patterns and Equality',
      strand: 'Algebra',
      overview:
        'Continue patterns and interpret the equal sign as balance between two sides.',
      learningObjectives: [
        'Describe how a repeating or growing pattern changes.',
        'Complete open number sentences with one unknown.',
      ],
      prerequisiteIdeas: ['early patterning', 'counting sequence'],
      exampleContexts: ['tile patterns', 'balance stories', 'number sentences'],
    },
    {
      key: 'TIME_AND_EVERYDAY_MEASUREMENT',
      label: 'Time and Everyday Measurement',
      strand: 'Measurement',
      overview:
        'Use informal and early standard references to talk about time and measure attributes.',
      learningObjectives: [
        'Compare and order everyday durations and events.',
        'Measure with simple informal units and explain the result.',
      ],
      prerequisiteIdeas: ['comparison language', 'sequencing events'],
      exampleContexts: ['school day', 'hand spans', 'container filling'],
    },
    {
      key: 'DATA_TALKS',
      label: 'Data Talks',
      strand: 'Statistics',
      overview:
        'Sort, classify, and talk about simple data displays in familiar contexts.',
      learningObjectives: [
        'Pose and answer a simple question using class data.',
        'Read information from object graphs or picture displays.',
      ],
      prerequisiteIdeas: ['sorting', 'counting collections'],
      exampleContexts: ['favourite fruit', 'weather', 'attendance'],
    },
  ],
  2: [
    {
      key: 'PLACE_VALUE_TO_120',
      label: 'Place Value to 120',
      strand: 'Number',
      overview:
        'Strengthen understanding of hundreds, tens, ones, and number line placement.',
      learningObjectives: [
        'Read, write, compare, and order numbers to 120.',
        'Locate numbers approximately on partially labelled number lines.',
      ],
      prerequisiteIdeas: ['two-digit numbers', 'tens and ones'],
      exampleContexts: ['number tracks', 'bundled materials', 'collections'],
    },
    {
      key: 'ADD_SUB_WITHIN_100',
      label: 'Addition and Subtraction Within 100',
      strand: 'Number',
      overview:
        'Use known facts and place value to calculate and solve one-step problems.',
      learningObjectives: [
        'Add and subtract numbers within 100 efficiently.',
        'Solve one-step additive problems using objects, diagrams, or equations.',
      ],
      prerequisiteIdeas: ['facts to 20', 'tens and ones'],
      exampleContexts: ['shopping', 'scores', 'collections'],
    },
    {
      key: 'EQUAL_GROUPS_AND_SKIP_COUNTING',
      label: 'Equal Groups and Skip Counting',
      strand: 'Number',
      overview:
        'Build multiplicative thinking through skip counting, equal groups, and simple arrays.',
      learningObjectives: [
        'Count in 2s, 5s, and 10s from suitable starting points.',
        'Represent multiplication and division with groups or arrays.',
      ],
      prerequisiteIdeas: [
        'counting forwards and backwards',
        'grouping objects',
      ],
      exampleContexts: ['egg cartons', 'rows of seats', 'shared packs'],
    },
    {
      key: 'FRACTIONS_HALVES_THIRDS_QUARTERS',
      label: 'Fractions: Halves, Thirds, and Quarters',
      strand: 'Number',
      overview:
        'Recognise and represent common unit fractions as equal parts of a whole or set.',
      learningObjectives: [
        'Represent halves, thirds, and quarters using shapes, sets, and lengths.',
        'Compare simple unit fractions of the same whole.',
      ],
      prerequisiteIdeas: ['equal sharing', 'partitioning shapes'],
      exampleContexts: ['food sharing', 'strips', 'sets of objects'],
    },
    {
      key: 'SHAPE_LOCATION_AND_TRANSFORMATIONS',
      label: 'Shape, Location, and Transformations',
      strand: 'Geometry',
      overview:
        'Describe shapes and movement using everyday and mathematical language.',
      learningObjectives: [
        'Describe the properties of familiar shapes.',
        'Identify flips, turns, and slides in concrete settings.',
      ],
      prerequisiteIdeas: ['common shape names', 'position words'],
      exampleContexts: ['pattern blocks', 'maps', 'picture arrangements'],
    },
  ],
  3: [
    {
      key: 'WHOLE_NUMBER_OPERATIONS',
      label: 'Whole Number Operations',
      strand: 'Number',
      overview:
        'Consolidate place value to 1000 and solve additive and multiplicative problems in familiar settings.',
      learningObjectives: [
        'Read, write, compare, and order whole numbers to 1000.',
        'Solve one-step and short multi-step additive problems using efficient methods.',
        'Recall and use multiplication and division facts in familiar families.',
      ],
      prerequisiteIdeas: ['skip counting', 'place value to 120', 'facts to 20'],
      exampleContexts: ['grouped collections', 'money', 'short word problems'],
      legacyTopicKeys: [
        'ADDITION',
        'SUBTRACTION',
        'MULTIPLICATION',
        'DIVISION',
      ],
    },
    {
      key: 'PATTERNS_AND_RELATIONSHIPS',
      label: 'Patterns and Relationships',
      strand: 'Algebra',
      overview:
        'Recognise, extend, and explain repeating and growing patterns.',
      learningObjectives: [
        'Describe the rule in a simple pattern.',
        'Use open number sentences to represent unknowns.',
      ],
      prerequisiteIdeas: ['repeating patterns', 'equal sign understanding'],
      exampleContexts: ['tile borders', 'skip-count sequences', 'tables'],
      legacyTopicKeys: ['PATTERN_RECOGNITION'],
    },
  ],
  4: [
    {
      key: 'WHOLE_NUMBER_AND_PLACE_VALUE',
      label: 'Whole Number and Place Value',
      strand: 'Number',
      overview:
        'Work with larger whole numbers and flexible additive and multiplicative strategies.',
      learningObjectives: [
        'Use place value to reason with larger whole numbers.',
        'Select efficient methods for addition, subtraction, multiplication, and division.',
      ],
      prerequisiteIdeas: ['place value to 1000', 'basic fact fluency'],
      exampleContexts: ['estimation', 'shopping', 'collections'],
      legacyTopicKeys: [
        'ADDITION',
        'SUBTRACTION',
        'MULTIPLICATION',
        'DIVISION',
        'PLACE_VALUE',
      ],
    },
    {
      key: 'FRACTIONS_DECIMALS_AND_TIME',
      label: 'Fractions, Decimals, and Time',
      strand: 'Number',
      overview:
        'Introduce decimals alongside fractions and everyday time measurement.',
      learningObjectives: [
        'Represent and compare basic fractions and decimals.',
        'Tell time and solve simple elapsed-time problems.',
      ],
      prerequisiteIdeas: ['unit fractions', 'money', 'number line'],
      exampleContexts: ['clocks', 'tenths grids', 'measurement contexts'],
      legacyTopicKeys: ['DECIMAL_BASICS', 'FRACTION_BASICS'],
    },
    {
      key: 'TIME_AND_MEASUREMENT',
      label: 'Time and Measurement',
      strand: 'Measurement',
      overview:
        'Tell time, compare durations, and solve everyday measurement problems using standard units.',
      learningObjectives: [
        'Read times and solve simple elapsed-time problems.',
        'Use standard measurement units in familiar contexts.',
      ],
      prerequisiteIdeas: [
        'sequencing events',
        'informal measurement',
        'halves and quarters',
      ],
      exampleContexts: [
        'class timetables',
        'travel durations',
        'daily routines',
      ],
      legacyTopicKeys: ['TIME_MEASUREMENT'],
    },
    {
      key: 'SHAPE_AND_PATTERNS',
      label: 'Shape and Patterns',
      strand: 'Geometry',
      overview:
        'Classify shapes and identify regularity in patterns and properties.',
      learningObjectives: [
        'Describe shape properties and sort by attributes.',
        'Extend pattern rules and explain the relationship.',
      ],
      prerequisiteIdeas: [
        'basic shape language',
        'repeating and growing patterns',
      ],
      exampleContexts: ['polygons', 'tilings', 'shape sorts'],
      legacyTopicKeys: ['PATTERN_RECOGNITION', 'SHAPE_PROPERTIES'],
    },
  ],
  5: [
    {
      key: 'ADVANCED_ARITHMETIC_AND_NUMBER_SENSE',
      label: 'Advanced Arithmetic and Number Sense',
      strand: 'Number',
      overview:
        'Develop fluency with large whole numbers, factors, multiples, and efficient written methods.',
      learningObjectives: [
        'Use efficient strategies and written methods for the four operations.',
        'Reason about factors, multiples, and the structure of numbers.',
      ],
      prerequisiteIdeas: ['place value', 'basic operation fluency'],
      exampleContexts: ['timetables', 'grouping problems', 'estimation tasks'],
      legacyTopicKeys: ['ADVANCED_ARITHMETIC'],
    },
    {
      key: 'FRACTIONS_DECIMALS_AND_RATIO',
      label: 'Fractions, Decimals, and Ratio',
      strand: 'Number',
      overview:
        'Connect fractions, decimals, and proportional reasoning in meaningful contexts.',
      learningObjectives: [
        'Calculate with fractions and decimals in supported settings.',
        'Compare quantities using simple ratio language and representations.',
      ],
      prerequisiteIdeas: ['fraction equivalence', 'decimal basics'],
      exampleContexts: ['recipes', 'measurement', 'money'],
      legacyTopicKeys: [
        'DECIMAL_OPERATIONS',
        'FRACTION_OPERATIONS',
        'RATIO_PROPORTION',
      ],
    },
    {
      key: 'ALGEBRAIC_THINKING',
      label: 'Algebraic Thinking',
      strand: 'Algebra',
      overview:
        'Use rules, relationships, and unknowns to reason about patterns and expressions.',
      learningObjectives: [
        'Describe and continue numerical patterns using rules.',
        'Represent unknown values using simple equations or expressions.',
      ],
      prerequisiteIdeas: ['pattern rules', 'open sentences'],
      exampleContexts: ['tables', 'growing patterns', 'balance-style problems'],
      legacyTopicKeys: ['ALGEBRAIC_THINKING'],
    },
  ],
  6: [
    {
      key: 'MULTI_DIGIT_OPERATIONS_AND_POWERS',
      label: 'Multi-Digit Operations and Powers',
      strand: 'Number',
      overview:
        'Extend operations to larger numbers and apply powers and efficient decomposition.',
      learningObjectives: [
        'Solve problems involving large whole numbers accurately and efficiently.',
        'Interpret and use squared numbers in suitable contexts.',
      ],
      prerequisiteIdeas: ['written methods', 'place value'],
      exampleContexts: ['population counts', 'area models', 'estimation'],
      legacyTopicKeys: ['LARGE_NUMBER_OPERATIONS'],
    },
    {
      key: 'FRACTIONS_DECIMALS_PERCENTAGES',
      label: 'Fractions, Decimals, and Percentages',
      strand: 'Number',
      overview:
        'Move flexibly among rational-number representations and operations.',
      learningObjectives: [
        'Add, subtract, and compare fractions and decimals.',
        'Interpret percentages as parts of 100 in simple contexts.',
      ],
      prerequisiteIdeas: ['fraction operations', 'decimal operations'],
      exampleContexts: ['discounts', 'measurement', 'data summaries'],
      legacyTopicKeys: ['ADVANCED_FRACTIONS_DECIMALS'],
    },
    {
      key: 'ALGEBRA_AND_PATTERNS',
      label: 'Algebra and Patterns',
      strand: 'Algebra',
      overview:
        'Generalise patterns and solve equations with increasing symbolic confidence.',
      learningObjectives: [
        'Describe and extend linear-style patterns.',
        'Solve simple equations and explain the method used.',
      ],
      prerequisiteIdeas: ['pattern rules', 'unknowns'],
      exampleContexts: ['tables', 'growing shapes', 'input-output machines'],
      legacyTopicKeys: ['ALGEBRAIC_EQUATIONS', 'ADVANCED_PATTERNS'],
    },
    {
      key: 'GEOMETRY_MEASUREMENT_AND_DATA',
      label: 'Geometry, Measurement, and Data',
      strand: 'Measurement',
      overview:
        'Apply number knowledge to area, volume, coordinates, measurement conversions, and data reasoning.',
      learningObjectives: [
        'Solve area, volume, and coordinate problems using suitable representations.',
        'Interpret data displays and basic probability statements.',
      ],
      prerequisiteIdeas: ['shape properties', 'metric units', 'graphs'],
      exampleContexts: ['floor plans', 'maps', 'survey data'],
      legacyTopicKeys: [
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
  ],
  7: [
    {
      key: 'INTEGERS_AND_RATIONAL_NUMBERS',
      label: 'Integers and Rational Numbers',
      strand: 'Number',
      overview:
        'Use integers, fractions, and decimals fluently and explain reasoning with suitable conventions.',
      learningObjectives: [
        'Operate with integers and rational numbers in context.',
        'Use proportional and multiplicative reasoning to solve number problems.',
      ],
      prerequisiteIdeas: [
        'fractions and decimals',
        'negative number awareness',
      ],
      exampleContexts: ['temperature', 'elevation', 'financial contexts'],
      legacyTopicKeys: [
        'ADVANCED_NUMBER_OPERATIONS',
        'FRACTION_DECIMAL_MASTERY',
      ],
    },
    {
      key: 'LINEAR_PATTERNS_AND_EQUATIONS',
      label: 'Linear Patterns and Equations',
      strand: 'Algebra',
      overview: 'Represent relationships using tables, rules, and equations.',
      learningObjectives: [
        'Generalise patterns using algebraic language.',
        'Solve and explain simple linear equations.',
      ],
      prerequisiteIdeas: [
        'pattern rules',
        'unknowns',
        'input-output reasoning',
      ],
      exampleContexts: [
        'cost tables',
        'tile patterns',
        'formula-based situations',
      ],
      legacyTopicKeys: ['ALGEBRAIC_FOUNDATIONS'],
    },
    {
      key: 'SPACE_MEASUREMENT_AND_DATA',
      label: 'Space, Measurement, and Data',
      strand: 'Geometry',
      overview:
        'Use geometric and statistical reasoning to justify solutions and investigate variation.',
      learningObjectives: [
        'Reason about shapes, angles, units, and transformations.',
        'Interpret data and probability to evaluate simple claims.',
      ],
      prerequisiteIdeas: ['area and volume', 'metric conversion', 'graphs'],
      exampleContexts: ['maps', 'design tasks', 'survey results'],
      legacyTopicKeys: [
        'GEOMETRY_SPATIAL_REASONING',
        'MULTI_UNIT_CONVERSIONS',
        'DATA_ANALYSIS_PROBABILITY',
      ],
    },
  ],
  8: [
    {
      key: 'NUMBER_SYSTEMS_AND_PROPORTIONAL_REASONING',
      label: 'Number Systems and Proportional Reasoning',
      strand: 'Number',
      overview:
        'Connect primes, integers, fractions, decimals, percentages, and ratios in richer problems.',
      learningObjectives: [
        'Reason flexibly across multiple number forms.',
        'Use ratio, proportion, and percentage in real-world settings.',
      ],
      prerequisiteIdeas: ['integer operations', 'fractions and decimals'],
      exampleContexts: ['finance', 'scale', 'comparison shopping'],
      legacyTopicKeys: [
        'PRIME_COMPOSITE_NUMBERS',
        'NEGATIVE_NUMBERS',
        'FRACTION_DECIMAL_PERCENTAGE',
        'RATIOS_PROPORTIONS',
        'FINANCIAL_LITERACY',
      ],
    },
    {
      key: 'ALGEBRAIC_GENERALISATION',
      label: 'Algebraic Generalisation',
      strand: 'Algebra',
      overview:
        'Manipulate expressions and solve linear-style problems using increasingly formal notation.',
      learningObjectives: [
        'Solve linear equations and describe the steps clearly.',
        'Use algebraic manipulation to represent and simplify relationships.',
      ],
      prerequisiteIdeas: ['linear patterns', 'equations'],
      exampleContexts: ['rules', 'equation puzzles', 'growing patterns'],
      legacyTopicKeys: [
        'NUMBER_PATTERNS',
        'LINEAR_EQUATIONS',
        'ALGEBRAIC_MANIPULATION',
      ],
    },
    {
      key: 'MEASUREMENT_GEOMETRY_AND_RATE',
      label: 'Measurement, Geometry, and Rate',
      strand: 'Measurement',
      overview:
        'Apply measurement formulas, conversions, spatial reasoning, and rate to solve unfamiliar tasks.',
      learningObjectives: [
        'Calculate perimeter, area, volume, and rate with justified method choice.',
        'Convert units and interpret the effect on solutions.',
      ],
      prerequisiteIdeas: [
        'area and volume',
        'unit conversion',
        'spatial reasoning',
      ],
      exampleContexts: ['travel', 'construction', 'sports'],
      legacyTopicKeys: [
        'PERIMETER_AREA_VOLUME',
        'UNIT_CONVERSIONS',
        'SPEED_CALCULATIONS',
      ],
    },
  ],
  9: [
    {
      key: 'PROPORTIONAL_REASONING',
      label: 'Proportional Reasoning',
      strand: 'Number',
      overview:
        'Use multiplicative relationships to transform numerical quantities, measurements, and shapes.',
      learningObjectives: [
        'Solve problems involving ratios, rates, scale, and proportional change.',
        'Justify proportional reasoning with equations or tables.',
      ],
      prerequisiteIdeas: ['ratio and proportion', 'percentages', 'unit rates'],
      exampleContexts: ['recipes', 'maps', 'currency and finance'],
    },
    {
      key: 'TABLES_EQUATIONS_AND_GRAPHS',
      label: 'Tables, Equations, and Graphs',
      strand: 'Algebra',
      overview:
        'Generalise relationships across tables, equations, and graph representations.',
      learningObjectives: [
        'Link multiple representations of the same relationship.',
        'Use graphs and equations to describe linear trends and patterns.',
      ],
      prerequisiteIdeas: ['linear equations', 'input-output reasoning'],
      exampleContexts: ['distance-time', 'cost models', 'growth tables'],
    },
    {
      key: 'AREA_VOLUME_AND_CIRCLES',
      label: 'Area, Volume, and Circles',
      strand: 'Measurement',
      overview:
        'Extend area, perimeter, and volume reasoning to circles and prisms.',
      learningObjectives: [
        'Solve problems involving circle measures and prism volume.',
        'Select suitable formulas and justify how they apply to the shape.',
      ],
      prerequisiteIdeas: ['perimeter and area', 'volume formulas'],
      exampleContexts: ['design plans', 'packaging', 'sports courts'],
    },
    {
      key: 'RIGHT_ANGLE_TRIANGLES',
      label: 'Right-Angled Triangles',
      strand: 'Geometry',
      overview:
        'Use proportional reasoning and geometric relationships in right-angled triangle problems.',
      learningObjectives: [
        'Recognise and apply right-triangle relationships in context.',
        'Explain how a chosen method relates to a geometric diagram.',
      ],
      prerequisiteIdeas: ['angles', 'scale drawings', 'proportion'],
      exampleContexts: ['ramps', 'shadows', 'navigation'],
    },
    {
      key: 'STATISTICAL_INVESTIGATIONS_AND_CHANCE',
      label: 'Statistical Investigations and Chance',
      strand: 'Statistics',
      overview:
        'Use data visualisations and chance models to investigate patterns, trends, and variation.',
      learningObjectives: [
        'Interpret patterns and variation in data displays.',
        'Use probability language and simple models to evaluate claims.',
      ],
      prerequisiteIdeas: ['data displays', 'probability experiments'],
      exampleContexts: ['surveys', 'sports data', 'simulations'],
    },
  ],
  10: [
    {
      key: 'ADVANCED_PROPORTIONAL_REASONING',
      label: 'Advanced Proportional Reasoning',
      strand: 'Number',
      overview:
        'Apply proportional reasoning fluently across numerical, geometric, and measurement contexts.',
      learningObjectives: [
        'Generalise multiplicative relationships across cases.',
        'Represent proportional situations using equations, graphs, and words.',
      ],
      prerequisiteIdeas: ['proportional reasoning', 'rate and scale'],
      exampleContexts: ['growth models', 'finance', 'measurement conversions'],
    },
    {
      key: 'ALGEBRAIC_CONNECTIONS',
      label: 'Algebraic Connections',
      strand: 'Algebra',
      overview:
        'Coordinate tables, equations, and graphs to solve and explain algebraic problems.',
      learningObjectives: [
        'Move flexibly among tables, equations, and graphs.',
        'Explain how algebraic structure supports efficient problem solving.',
      ],
      prerequisiteIdeas: ['linear relationships', 'graph interpretation'],
      exampleContexts: ['modelling', 'comparison of plans', 'trend analysis'],
    },
    {
      key: 'GEOMETRIC_AND_MEASUREMENT_APPLICATIONS',
      label: 'Geometric and Measurement Applications',
      strand: 'Geometry',
      overview:
        'Solve unfamiliar geometry and measurement problems that require representation choice and justification.',
      learningObjectives: [
        'Use diagrams and formulas to solve compound measurement tasks.',
        'Explain assumptions and checks used in the solution.',
      ],
      prerequisiteIdeas: [
        'circle and prism measures',
        'right-triangle reasoning',
      ],
      exampleContexts: [
        'design briefs',
        'construction plans',
        'navigation scenarios',
      ],
    },
    {
      key: 'DATA_TRENDS_VARIATION_AND_PROBABILITY',
      label: 'Data Trends, Variation, and Probability',
      strand: 'Statistics',
      overview:
        'Investigate trends, variation, and chance using purposeful data displays and contextual explanations.',
      learningObjectives: [
        'Interpret variation and trend from relevant data displays.',
        'Use probability reasoning to critique or support claims.',
      ],
      prerequisiteIdeas: ['statistical investigations', 'chance models'],
      exampleContexts: ['public data', 'experiments', 'media claims'],
    },
  ],
};

function buildYearDefinition(
  year: number,
  phase: string,
  focusSummary: string,
  languageFocus: string[] = []
) {
  return {
    year,
    phase,
    focusSummary,
    languageFocus,
    topics: (YEAR_TOPIC_SEEDS[year] || []).map((seed) =>
      defineTopic(year, seed)
    ),
  };
}

export const MATHEMATICS_CURRICULUM: SubjectCurriculumDefinition = {
  subject: 'mathematics',
  version: 'nz-maths-2025-seed-v1',
  sourceDocument: MATHEMATICS_SOURCE_PDF,
  extractedFrom: MATHEMATICS_SOURCE_EXTRACT,
  coverageStatus: 'seed',
  years: [
    buildYearDefinition(
      0,
      'Phase 1',
      'Build early counting, classification, comparison, and visual reasoning with concrete materials.'
    ),
    buildYearDefinition(
      1,
      'Phase 1',
      'Strengthen two-digit number sense, early operations, patterns, and simple data talk.'
    ),
    buildYearDefinition(
      2,
      'Phase 1',
      'Extend place value, additive reasoning, equal-group thinking, fractions, and shape language.'
    ),
    buildYearDefinition(
      3,
      'Phase 1',
      'Consolidate whole-number operations, simple multiplicative reasoning, and explainable pattern work.'
    ),
    buildYearDefinition(
      4,
      'Phase 2',
      'Use representations to model operations, fractions, decimals, measurement, and shape classification.'
    ),
    buildYearDefinition(
      5,
      'Phase 2',
      'Expand fluency with operations and rational numbers while building algebraic and proportional thinking.'
    ),
    buildYearDefinition(
      6,
      'Phase 2',
      'Apply larger-number, rational-number, algebraic, geometric, and data reasoning to richer contexts.'
    ),
    buildYearDefinition(
      7,
      'Phase 3',
      'Use logic, notation, and representation choice to justify solutions across number, algebra, geometry, and data.'
    ),
    buildYearDefinition(
      8,
      'Phase 3',
      'Generalise patterns and use proportional, algebraic, and geometric reasoning in unfamiliar contexts.'
    ),
    buildYearDefinition(
      9,
      'Phase 4',
      'Use proportional reasoning, algebraic representations, and geometric measures in extended problems.'
    ),
    buildYearDefinition(
      10,
      'Phase 4',
      'Coordinate proportional, algebraic, geometric, statistical, and probabilistic reasoning across multiple representations.'
    ),
  ],
};

export function getMathematicsYearPlan(year: number) {
  return (
    MATHEMATICS_CURRICULUM.years.find((entry) => entry.year === year) ?? null
  );
}

export function getMathematicsTopicCriteria(year: number, topicKey: string) {
  const yearPlan = getMathematicsYearPlan(year);
  if (!yearPlan) {
    return null;
  }

  return (
    yearPlan.topics.find(
      (topic) =>
        topic.key === topicKey ||
        topic.legacyTopicKeys?.includes(topicKey) === true
    ) ?? null
  );
}
