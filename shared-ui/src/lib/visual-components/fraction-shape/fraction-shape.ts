import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { FractionShapeParams } from '../visual-components.model';

/**
 * Renders a fraction diagram as an inline SVG.
 *
 * Three modes:
 *  'shade'   – fills the numerator sections (used in shading tasks)
 *  'divide'  – draws dividing lines only (student shades interactively)
 *  'outline' – shows the shape with section outlines only (recognition tasks)
 *
 * Two shapes: 'rectangle' (default) and 'circle'.
 */
@Component({
  selector: 'lib-fraction-shape',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host { display: block; }
      svg { width: 100%; height: auto; }
    `,
  ],
  template: `
    <svg
      [attr.viewBox]="viewBox()"
      role="img"
      [attr.aria-label]="ariaLabel()"
    >
      @if (isCircle()) {
        <!-- ── Circle (pie chart) ── -->
        @for (slice of circleSlices(); track $index) {
          <path
            [attr.d]="slice.d"
            [attr.fill]="slice.filled ? '#5c9d6a' : '#f0f4f8'"
            stroke="#1f6cb0"
            stroke-width="1.5"
          />
        }
        <!-- Fraction label -->
        <text
          [attr.x]="CX"
          [attr.y]="CY + R + 22"
          text-anchor="middle"
          font-size="13"
          fill="#1f6cb0"
          font-family="sans-serif"
        >
          {{ params().numerator }}/{{ params().denominator }}
        </text>
      } @else {
        <!-- ── Rectangle ── -->
        <!-- Background -->
        <rect
          x="10"
          y="10"
          [attr.width]="RECT_W"
          [attr.height]="RECT_H"
          fill="#f0f4f8"
          stroke="#1f6cb0"
          stroke-width="1.5"
          rx="3"
        />
        <!-- Section fills + dividers -->
        @for (sec of rectSections(); track $index) {
          @if (sec.filled) {
            <rect
              [attr.x]="sec.x"
              y="10"
              [attr.width]="sec.w"
              [attr.height]="RECT_H"
              fill="#5c9d6a"
              opacity="0.75"
            />
          }
          @if ($index > 0) {
            <!-- Dividing line between sections -->
            <line
              [attr.x1]="sec.x"
              y1="10"
              [attr.x2]="sec.x"
              [attr.y2]="10 + RECT_H"
              stroke="#1f6cb0"
              stroke-width="1.5"
            />
          }
        }
        <!-- Outer border on top to keep it crisp -->
        <rect
          x="10"
          y="10"
          [attr.width]="RECT_W"
          [attr.height]="RECT_H"
          fill="none"
          stroke="#1f6cb0"
          stroke-width="1.5"
          rx="3"
        />
        <!-- Fraction label -->
        <text
          [attr.x]="10 + RECT_W / 2"
          [attr.y]="10 + RECT_H + 20"
          text-anchor="middle"
          font-size="13"
          fill="#1f6cb0"
          font-family="sans-serif"
        >
          {{ params().numerator }}/{{ params().denominator }}
        </text>
      }
    </svg>
  `,
})
export class FractionShapeComponent {
  readonly params = input.required<FractionShapeParams>();

  protected readonly CX = 80;
  protected readonly CY = 80;
  protected readonly R  = 60;

  protected readonly RECT_W = 240;
  protected readonly RECT_H = 60;

  protected readonly isCircle = computed(
    () => (this.params().shape ?? 'rectangle') === 'circle'
  );

  protected readonly viewBox = computed(() =>
    this.isCircle()
      ? `0 0 ${this.CX * 2} ${this.CY * 2 + 30}`
      : `0 0 ${this.RECT_W + 20} ${this.RECT_H + 40}`
  );

  protected readonly ariaLabel = computed(() => {
    const { numerator, denominator } = this.params();
    return `Fraction diagram showing ${numerator} out of ${denominator} parts`;
  });

  // ── Circle slices ─────────────────────────────────────────────────────────

  protected readonly circleSlices = computed(() => {
    const { numerator, denominator, mode = 'shade' } = this.params();
    const slices: Array<{ d: string; filled: boolean }> = [];

    for (let i = 0; i < denominator; i++) {
      const startAngle = (i / denominator) * 2 * Math.PI - Math.PI / 2;
      const endAngle = ((i + 1) / denominator) * 2 * Math.PI - Math.PI / 2;

      const x1 = this.CX + this.R * Math.cos(startAngle);
      const y1 = this.CY + this.R * Math.sin(startAngle);
      const x2 = this.CX + this.R * Math.cos(endAngle);
      const y2 = this.CY + this.R * Math.sin(endAngle);
      const largeArc = denominator === 1 ? 1 : 0;

      const d =
        denominator === 1
          ? `M ${this.CX} ${this.CY} m -${this.R} 0 a ${this.R} ${this.R} 0 1 1 ${this.R * 2} 0 a ${this.R} ${this.R} 0 1 1 -${this.R * 2} 0`
          : `M ${this.CX} ${this.CY} L ${x1} ${y1} A ${this.R} ${this.R} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      slices.push({ d, filled: mode === 'shade' && i < numerator });
    }
    return slices;
  });

  // ── Rectangle sections ────────────────────────────────────────────────────

  protected readonly rectSections = computed(() => {
    const { numerator, denominator, mode = 'shade' } = this.params();
    const secW = this.RECT_W / denominator;
    return Array.from({ length: denominator }, (_, i) => ({
      x: 10 + i * secW,
      w: secW,
      filled: mode === 'shade' && i < numerator,
    }));
  });
}
