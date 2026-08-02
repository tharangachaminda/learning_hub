/**
 * Visual component model for Maths Mate skill-builder questions.
 *
 * Every extracted question that `requires_visual === true` carries a
 * `visual_component` object of shape `{ type, description, params? }`.
 * These interfaces define the strongly-typed params for each renderer.
 */

// ─── Visual type registry ─────────────────────────────────────────────────────

export type VisualType =
  // Number lines
  | 'number_line'
  | 'number_line_addition_subtraction'
  | 'fraction_number_line'
  | 'mixed_number_number_line'
  // Arrays / blocks
  | 'dot_array'
  | 'base_10_blocks'
  | 'abacus'
  | 'picture_groups'
  // Fractions
  | 'fraction_shape_shade'
  | 'fraction_shape_divide'
  | 'fraction_shape_recognise'
  | 'fraction_bar_compare'
  // Geometry
  | 'geometry_2d_shapes'
  | 'geometry_3d_shapes'
  | 'symmetry_diagram'
  | 'angle_diagram'
  // Data / graphs
  | 'picture_graph'
  | 'bar_graph'
  | 'tally_chart'
  // Measurement
  | 'clock_face'
  | 'calendar'
  | 'ruler'
  | 'thermometer'
  | 'weighing_scale'
  | 'coins_and_notes'
  // Place value
  | 'place_value_table'
  // Location / mapping
  | 'grid_map_coordinates'
  | 'location_scene'
  // Sets / logic
  | 'venn_diagram'
  | 'carroll_diagram'
  // Misc
  | 'count_objects';

// ─── Parameter interfaces ─────────────────────────────────────────────────────

export interface NumberLineParams {
  min: number;
  max: number;
  /** Label tick marks every N units (default 1, or 5/10 for large ranges) */
  labelStep?: number;
  /** Positions highlighted with a filled dot */
  marked?: number[];
  /** Counting arcs drawn above the line */
  jumps?: Array<{ from: number; to: number }>;
  /** Divide 0‒1 into this many equal parts (fraction number line) */
  fractionDenominator?: number;
}

export interface DotArrayParams {
  /** Total number of dots */
  total: number;
  /** Number of groups (rows) */
  groups: number;
  /** Dots per group — computed from total/groups when omitted */
  perGroup?: number;
  /** Draw a rectangle outline around each group */
  showGroupOutlines?: boolean;
}

export interface Base10BlocksParams {
  thousands?: number;
  hundreds?: number;
  tens?: number;
  ones?: number;
}

export interface FractionShapeParams {
  numerator: number;
  denominator: number;
  /** Shape to divide (default 'rectangle') */
  shape?: 'circle' | 'rectangle';
  /**
   * 'shade'   – fill numerator sections in colour
   * 'divide'  – draw dividing lines only (student shades)
   * 'outline' – unshaded for recognition tasks
   */
  mode?: 'shade' | 'divide' | 'outline';
}

export interface FractionBarParams {
  fractionA: [number, number]; // [numerator, denominator]
  fractionB: [number, number];
}

export interface GeometryShapeParams {
  /**
   * Shape name: 'triangle' | 'square' | 'rectangle' | 'circle' |
   * 'pentagon' | 'hexagon' | 'heptagon' | 'octagon' |
   * 'rhombus' | 'parallelogram' | 'trapezium' | 'kite'
   */
  shapeName: string;
  showLabel?: boolean;
}

export interface AngleParams {
  degrees: number;
  showLabel?: boolean;
}

export interface ClockParams {
  hours: number;
  minutes: number;
}

export interface PlaceValueTableParams {
  value: number;
  columns?: ('thousands' | 'hundreds' | 'tens' | 'ones')[];
}

export interface TallyParams {
  categories: Array<{ label: string; count: number }>;
}

/** Union of all concrete param shapes */
export type VisualParams =
  | NumberLineParams
  | DotArrayParams
  | Base10BlocksParams
  | FractionShapeParams
  | FractionBarParams
  | GeometryShapeParams
  | AngleParams
  | ClockParams
  | PlaceValueTableParams
  | TallyParams
  | Record<string, unknown>;

/**
 * The `visual_component` object on each extracted question.
 * Mirrors the JSON shape produced by extract_pdf_questions.py.
 */
export interface VisualComponentData {
  type: VisualType;
  description: string;
  /**
   * Pre-computed rendering params.
   * If absent, call `extractVisualParams()` with the raw question text.
   */
  params?: VisualParams;
}
