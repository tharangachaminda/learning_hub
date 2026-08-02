/**
 * Parameter extractor for Maths Mate visual components.
 *
 * Parses raw question text + skill description to produce typed rendering
 * params for each visual type.  Used when params are not pre-computed.
 */
import {
  AngleParams,
  Base10BlocksParams,
  DotArrayParams,
  FractionShapeParams,
  GeometryShapeParams,
  NumberLineParams,
  VisualParams,
  VisualType,
} from './visual-components.model';

// ─── Public entry point ───────────────────────────────────────────────────────

/**
 * Extract rendering parameters from raw question text for a given visual type.
 *
 * @param type          - The visual component type (from the extracted JSON)
 * @param questionText  - The raw question text
 * @param skillDescription - Skill description for additional context
 */
export function extractVisualParams(
  type: VisualType,
  questionText: string,
  skillDescription = ''
): VisualParams {
  const combined = `${skillDescription} ${questionText}`.toLowerCase();

  switch (type) {
    case 'number_line':
    case 'number_line_addition_subtraction':
      return parseNumberLine(questionText, combined);

    case 'fraction_number_line':
      return {
        min: 0,
        max: 1,
        fractionDenominator: parseDenominator(combined),
      } satisfies NumberLineParams;

    case 'mixed_number_number_line':
      return { min: 0, max: 3, labelStep: 1 } satisfies NumberLineParams;

    case 'dot_array':
      return parseDotArray(questionText, combined);

    case 'base_10_blocks':
      return parseBase10(questionText, combined);

    case 'fraction_shape_shade':
    case 'fraction_shape_divide':
    case 'fraction_shape_recognise':
      return parseFractionShape(combined, type);

    case 'geometry_2d_shapes':
      return parseGeometry(combined);

    case 'angle_diagram':
      return parseAngle(combined);

    default:
      return {};
  }
}

// ─── Number line ──────────────────────────────────────────────────────────────

function parseNumberLine(text: string, combined: string): NumberLineParams {
  let min = 0;
  let max = 10;
  let jumps: NumberLineParams['jumps'];
  let marked: number[] = [];

  // Detect explicit number-line scale in text, e.g. "0 1 2 3 4 5 6 7 8 9 10"
  const seqMatch = text.match(/\b0\s+1(?:\s+\d+){3,}\s+(\d+)\b/);
  if (seqMatch) {
    const nums = seqMatch[0].split(/\s+/).map(Number);
    min = nums[0];
    max = nums[nums.length - 1];
  }

  // Subtraction arc: "6 − 4 =" or "6 - 4 ="
  const subMatch = text.match(/(\d+)\s*[−\-]\s*(\d+)\s*=/);
  if (subMatch) {
    const a = parseInt(subMatch[1], 10);
    const b = parseInt(subMatch[2], 10);
    max = Math.max(max, a + 2);
    jumps = [{ from: a, to: a - b }];
    marked = [a, Math.max(0, a - b)];
  }

  // Addition arc: "3 + 4 ="
  const addMatch = text.match(/(\d+)\s*\+\s*(\d+)\s*=/);
  if (addMatch && !subMatch) {
    const a = parseInt(addMatch[1], 10);
    const b = parseInt(addMatch[2], 10);
    max = Math.max(max, a + b + 2);
    jumps = [{ from: a, to: a + b }];
    marked = [a, a + b];
  }

  // Skip counting: "count on by 3s from 90"
  const skipMatch = combined.match(/count\s+on\s+by\s+(\d+)s?\s+from\s+(\d+)/);
  if (skipMatch) {
    const step = parseInt(skipMatch[1], 10);
    const start = parseInt(skipMatch[2], 10);
    min = start;
    max = start + step * 6;
    jumps = Array.from({ length: 5 }, (_, i) => ({
      from: start + step * i,
      to: start + step * (i + 1),
    }));
    marked = [start];
  }

  const range = max - min;
  const labelStep = range > 50 ? 50 : range > 20 ? 10 : range > 10 ? 5 : 1;

  return {
    min,
    max,
    labelStep,
    marked: marked.length ? marked : undefined,
    jumps,
  };
}

// ─── Dot array ────────────────────────────────────────────────────────────────

function parseDotArray(text: string, _combined: string): DotArrayParams {
  // Division: "30 ÷ 5 ="
  const divMatch = text.match(/(\d+)\s*[÷/]\s*(\d+)\s*=/);
  if (divMatch) {
    const total = parseInt(divMatch[1], 10);
    const groups = parseInt(divMatch[2], 10);
    return { total, groups, perGroup: Math.floor(total / groups), showGroupOutlines: true };
  }

  // Multiplication: "3 × 4 =" or "3 x 4 ="
  const mulMatch = text.match(/(\d+)\s*[×xX\*]\s*(\d+)\s*=/);
  if (mulMatch) {
    const groups = parseInt(mulMatch[1], 10);
    const perGroup = parseInt(mulMatch[2], 10);
    return { total: groups * perGroup, groups, perGroup, showGroupOutlines: true };
  }

  return { total: 12, groups: 3, perGroup: 4, showGroupOutlines: true };
}

// ─── Base 10 blocks ───────────────────────────────────────────────────────────

function parseBase10(text: string, _combined: string): Base10BlocksParams {
  const params: Base10BlocksParams = {};

  // "2 tens 5 ones" / "4 hundreds" / "3 thousands"
  const thou = text.match(/(\d+)\s+thousand/i);
  const hund = text.match(/(\d+)\s+hundred/i);
  const tens = text.match(/(\d+)\s+ten/i);
  const ones = text.match(/(\d+)\s+one/i);

  if (thou) params.thousands = parseInt(thou[1], 10);
  if (hund) params.hundreds = parseInt(hund[1], 10);
  if (tens) params.tens = parseInt(tens[1], 10);
  if (ones) params.ones = parseInt(ones[1], 10);

  // Fall back: parse the result number "= 472"
  if (!params.thousands && !params.hundreds && !params.tens && !params.ones) {
    const numMatch = text.match(/=\s*(\d{1,4})\b/);
    if (numMatch) {
      const n = parseInt(numMatch[1], 10);
      params.thousands = Math.floor(n / 1000) || undefined;
      params.hundreds = Math.floor((n % 1000) / 100) || undefined;
      params.tens = Math.floor((n % 100) / 10) || undefined;
      params.ones = n % 10 || undefined;
    }
  }

  // Ultimate default
  if (!params.thousands && !params.hundreds && !params.tens && !params.ones) {
    params.tens = 2;
    params.ones = 3;
  }

  return params;
}

// ─── Fraction shape ───────────────────────────────────────────────────────────

function parseFractionShape(combined: string, type: VisualType): FractionShapeParams {
  let numerator = 1;
  let denominator = 4;

  const fracMatch = combined.match(/(\d+)\s*\/\s*(\d+)/);
  if (fracMatch) {
    numerator = parseInt(fracMatch[1], 10);
    denominator = parseInt(fracMatch[2], 10);
  } else {
    denominator = parseDenominator(combined);
  }

  const mode =
    type === 'fraction_shape_shade'
      ? 'shade'
      : type === 'fraction_shape_divide'
        ? 'divide'
        : 'outline';

  return { numerator, denominator, shape: 'rectangle', mode };
}

function parseDenominator(combined: string): number {
  if (combined.includes('twelfth')) return 12;
  if (combined.includes('tenth')) return 10;
  if (combined.includes('ninth')) return 9;
  if (combined.includes('eighth')) return 8;
  if (combined.includes('seventh')) return 7;
  if (combined.includes('sixth')) return 6;
  if (combined.includes('fifth')) return 5;
  if (combined.includes('quarter') || combined.includes('fourth')) return 4;
  if (combined.includes('third')) return 3;
  if (combined.includes('halv') || combined.includes('half')) return 2;
  // Last resort: find "1/N"
  const m = combined.match(/1\s*\/\s*(\d+)/);
  return m ? parseInt(m[1], 10) : 4;
}

// ─── Geometry ─────────────────────────────────────────────────────────────────

function parseGeometry(combined: string): GeometryShapeParams {
  // Priority order: more specific shapes first
  const candidates: string[] = [
    'parallelogram',
    'trapezium',
    'rhombus',
    'kite',
    'rectangle',
    'square',
    'decagon',
    'nonagon',
    'octagon',
    'heptagon',
    'hexagon',
    'pentagon',
    'quadrilateral',
    'triangle',
    'circle',
  ];
  for (const s of candidates) {
    if (combined.includes(s)) return { shapeName: s, showLabel: true };
  }
  return { shapeName: 'square', showLabel: false };
}

// ─── Angle ────────────────────────────────────────────────────────────────────

function parseAngle(combined: string): AngleParams {
  // Look for explicit degree value: "45°" or "45 degrees"
  const degMatch = combined.match(/(\d+)\s*(?:°|degrees?)/);
  if (degMatch) return { degrees: parseInt(degMatch[1], 10), showLabel: true };

  // Classify by name
  if (combined.includes('right angle')) return { degrees: 90, showLabel: true };
  if (combined.includes('acute')) return { degrees: 45, showLabel: true };
  if (combined.includes('obtuse')) return { degrees: 120, showLabel: true };
  if (combined.includes('reflex')) return { degrees: 240, showLabel: true };
  if (combined.includes('straight')) return { degrees: 180, showLabel: true };

  return { degrees: 90, showLabel: false };
}
