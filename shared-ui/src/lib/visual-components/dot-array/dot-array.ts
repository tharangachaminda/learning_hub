import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DotArrayParams } from '../visual-components.model';

/**
 * Renders a rectangular dot array as an inline SVG.
 *
 * Used for multiplication and division skill builders where the student
 * circles equal groups of dots to model the operation.
 */
@Component({
  selector: 'lib-dot-array',
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
      aria-label="Dot array"
    >
      <!-- Group outlines -->
      @if (params().showGroupOutlines) {
        @for (grp of groupRects(); track $index) {
          <rect
            [attr.x]="grp.x"
            [attr.y]="grp.y"
            [attr.width]="grp.w"
            [attr.height]="grp.h"
            rx="4"
            fill="none"
            stroke="#5c9d6a"
            stroke-width="1.5"
            stroke-dasharray="4 2"
          />
        }
      }

      <!-- Dots -->
      @for (dot of dots(); track $index) {
        <circle
          [attr.cx]="dot.cx"
          [attr.cy]="dot.cy"
          r="7"
          fill="#1f6cb0"
          opacity="0.85"
        />
      }

      <!-- Group labels (Group 1, Group 2 …) -->
      @if (params().showGroupOutlines) {
        @for (grp of groupRects(); track $index) {
          <text
            [attr.x]="grp.x + grp.w / 2"
            [attr.y]="grp.y + grp.h + 14"
            text-anchor="middle"
            font-size="10"
            fill="#5c9d6a"
            font-family="sans-serif"
          >
            Group {{ $index + 1 }}
          </text>
        }
      }
    </svg>
  `,
})
export class DotArrayComponent {
  readonly params = input.required<DotArrayParams>();

  private readonly DOT_R = 7;
  private readonly DOT_GAP = 22;       // centre-to-centre within a group
  private readonly GROUP_PAD = 8;      // padding inside group outline
  private readonly GROUP_GAP = 18;     // gap between groups
  private readonly PAD = 16;           // outer margin

  private readonly layout = computed(() => {
    const { total, groups, perGroup: rawPPG } = this.params();
    const perGroup = rawPPG ?? Math.ceil(total / Math.max(groups, 1));
    const cols = Math.min(perGroup, 10);   // cap at 10 per row
    const rows = Math.ceil(perGroup / cols);
    return { perGroup, cols, rows, groups: Math.max(groups, 1) };
  });

  private readonly groupW = computed(() => {
    const { cols } = this.layout();
    return 2 * this.GROUP_PAD + cols * this.DOT_GAP - (this.DOT_GAP - 2 * this.DOT_R);
  });

  private readonly groupH = computed(() => {
    const { rows } = this.layout();
    return 2 * this.GROUP_PAD + rows * this.DOT_GAP - (this.DOT_GAP - 2 * this.DOT_R);
  });

  protected readonly viewBox = computed(() => {
    const { groups } = this.layout();
    const labelH = this.params().showGroupOutlines ? 20 : 0;
    const w = this.PAD * 2 + groups * (this.groupW() + this.GROUP_GAP) - this.GROUP_GAP;
    const h = this.PAD * 2 + this.groupH() + labelH;
    return `0 0 ${w} ${h}`;
  });

  protected readonly groupRects = computed(() => {
    const { groups } = this.layout();
    const gw = this.groupW();
    const gh = this.groupH();
    return Array.from({ length: groups }, (_, i) => ({
      x: this.PAD + i * (gw + this.GROUP_GAP),
      y: this.PAD,
      w: gw,
      h: gh,
    }));
  });

  protected readonly dots = computed(() => {
    const { total, groups, perGroup, cols, rows } = this.layout();
    const gw = this.groupW();
    const result: Array<{ cx: number; cy: number }> = [];
    let placed = 0;

    for (let g = 0; g < groups && placed < total; g++) {
      const gx = this.PAD + g * (gw + this.GROUP_GAP);
      for (let r = 0; r < rows && placed < total; r++) {
        for (let c = 0; c < cols && placed < total; c++) {
          const cx =
            gx + this.GROUP_PAD + this.DOT_R + c * this.DOT_GAP;
          const cy =
            this.PAD + this.GROUP_PAD + this.DOT_R + r * this.DOT_GAP;
          result.push({ cx, cy });
          placed++;
        }
      }
    }
    return result;
  });
}
