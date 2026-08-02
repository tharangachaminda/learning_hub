import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { NumberLineParams } from '../visual-components.model';

/**
 * Renders a horizontal number line as an inline SVG.
 *
 * Supports:
 * - Arbitrary integer ranges with auto-scaled tick labels
 * - Highlighted positions (filled dots)
 * - Counting jump arcs above the line
 * - Fraction mode (0‒1 divided into equal parts)
 */
@Component({
  selector: 'lib-number-line',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host { display: block; }
      svg { width: 100%; height: auto; overflow: visible; }
    `,
  ],
  template: `
    <svg
      [attr.viewBox]="viewBox()"
      class="number-line-svg"
      role="img"
      aria-label="Number line"
    >
      <!-- Arrowhead marker -->
      <defs>
        <marker
          id="arrowR"
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill="#1f6cb0" />
        </marker>
        <marker
          id="arrowL"
          markerWidth="8"
          markerHeight="6"
          refX="0"
          refY="3"
          orient="auto-start-reverse"
        >
          <polygon points="0 0, 8 3, 0 6" fill="#1f6cb0" />
        </marker>
      </defs>

      <!-- Main line with arrow ends -->
      <line
        [attr.x1]="LEFT - 8"
        [attr.y1]="LINE_Y"
        [attr.x2]="rightEdge() + 8"
        [attr.y2]="LINE_Y"
        stroke="#1f6cb0"
        stroke-width="2"
        marker-end="url(#arrowR)"
        marker-start="url(#arrowL)"
      />

      <!-- Jump arcs (drawn before ticks so ticks render on top) -->
      @for (arc of jumpPaths(); track $index) {
        <path
          [attr.d]="arc.d"
          fill="none"
          stroke="#e2b850"
          stroke-width="2.5"
          stroke-linecap="round"
        />
        <!-- Arrow tip for arc end -->
        <polygon
          [attr.points]="arc.tipPoints"
          fill="#e2b850"
        />
      }

      <!-- Tick marks and labels -->
      @for (tick of ticks(); track tick.value) {
        <!-- Major tick -->
        <line
          [attr.x1]="tick.x"
          [attr.y1]="LINE_Y - TICK_H"
          [attr.x2]="tick.x"
          [attr.y2]="LINE_Y + TICK_H"
          stroke="#1f6cb0"
          stroke-width="1.5"
        />
        <!-- Label -->
        @if (tick.showLabel) {
          <text
            [attr.x]="tick.x"
            [attr.y]="LABEL_Y"
            text-anchor="middle"
            font-size="11"
            fill="#1f6cb0"
            font-family="sans-serif"
          >
            {{ tick.label }}
          </text>
        }
      }

      <!-- Marked position dots -->
      @for (pos of markedDots(); track pos.x) {
        <circle
          [attr.cx]="pos.x"
          [attr.cy]="LINE_Y"
          r="6"
          fill="#e2b850"
          stroke="#c09530"
          stroke-width="1"
        />
      }
    </svg>
  `,
})
export class NumberLineComponent {
  readonly params = input.required<NumberLineParams>();

  // ── Layout constants ────────────────────────────────────────
  protected readonly LEFT = 30;
  protected readonly LINE_Y = 55;
  protected readonly TICK_H = 7;
  protected readonly LABEL_Y = 72;
  private readonly W = 460;
  private readonly ARC_HEIGHT = 36;

  // ── Computed layout ─────────────────────────────────────────

  private readonly range = computed(() => {
    const { min, max } = this.params();
    return max - min;
  });

  private readonly pxPerUnit = computed(
    () => this.W / Math.max(this.range(), 1)
  );

  protected readonly rightEdge = computed(
    () => this.LEFT + this.W
  );

  protected readonly viewBox = computed(() => {
    const hasArcs = (this.params().jumps?.length ?? 0) > 0;
    const height = hasArcs ? 100 : 82;
    return `0 0 ${this.LEFT + this.W + 20} ${height}`;
  });

  private readonly px = (value: number) =>
    computed(
      () => this.LEFT + (value - this.params().min) * this.pxPerUnit()
    );

  protected readonly ticks = computed(() => {
    const { min, max, labelStep = 1, fractionDenominator } = this.params();
    const result: Array<{ value: number | string; x: number; showLabel: boolean; label: string }> = [];

    if (fractionDenominator) {
      // Fraction number line: 0 to 1 with fraction ticks
      for (let i = 0; i <= fractionDenominator; i++) {
        const v = i / fractionDenominator;
        const x = this.LEFT + v * this.W;
        const label =
          i === 0 ? '0' : i === fractionDenominator ? '1' : `${i}/${fractionDenominator}`;
        result.push({ value: v, x, showLabel: true, label });
      }
      return result;
    }

    for (let n = min; n <= max; n++) {
      const x = this.LEFT + (n - min) * this.pxPerUnit();
      result.push({
        value: n,
        x,
        showLabel: n % labelStep === 0,
        label: String(n),
      });
    }
    return result;
  });

  protected readonly markedDots = computed(() => {
    const { marked = [], min } = this.params();
    return marked.map((v) => ({
      x: this.LEFT + (v - min) * this.pxPerUnit(),
    }));
  });

  protected readonly jumpPaths = computed(() => {
    const { jumps = [], min } = this.params();
    const lineY = this.LINE_Y;
    const arcH = this.ARC_HEIGHT;
    const ppu = this.pxPerUnit();

    return jumps.map((j) => {
      const x1 = this.LEFT + (j.from - min) * ppu;
      const x2 = this.LEFT + (j.to - min) * ppu;
      const mid = (x1 + x2) / 2;
      const cpY = lineY - arcH;
      const d = `M ${x1} ${lineY} Q ${mid} ${cpY} ${x2} ${lineY}`;

      // Approximate arrow tip direction at the end of the quadratic bezier
      const dir = x2 > x1 ? 1 : -1;
      const tipPoints = `${x2},${lineY} ${x2 - dir * 8},${lineY - 5} ${x2 - dir * 8},${lineY + 5}`;

      return { d, tipPoints };
    });
  });
}
