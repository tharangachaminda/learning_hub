import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { Base10BlocksParams } from '../visual-components.model';

/**
 * Renders a base-10 block diagram as an inline SVG.
 *
 * Block sizes:
 *  Ones     – 12 × 12 small squares
 *  Tens     – 12 × 132 rod (10 unit squares stacked)
 *  Hundreds – 132 × 132 flat (10×10 grid of unit squares)
 *  Thousands – labelled cube icon (too large to draw realistically)
 *
 * Up to 9 of each denomination are displayed.
 */
@Component({
  selector: 'lib-base10-blocks',
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
      aria-label="Base-10 block diagram"
    >
      <!-- Thousands group -->
      @for (b of thousandBlocks(); track $index) {
        <!-- Simplified 3D cube icon for thousands -->
        <rect [attr.x]="b.x" [attr.y]="b.y" width="38" height="38"
              fill="#d0e8ff" stroke="#1f6cb0" stroke-width="1.5" rx="2"/>
        <!-- Top face -->
        <polygon [attr.points]="b.x+8+','+b.y + ' '+(b.x+38)+','+b.y + ' '+(b.x+30)+','+(b.y-8) + ' '+b.x+','+(b.y-8)"
                 fill="#b0d4f8" stroke="#1f6cb0" stroke-width="1"/>
        <!-- Right face -->
        <polygon [attr.points]="(b.x+38)+','+b.y + ' '+(b.x+38)+','+(b.y+38) + ' '+(b.x+30)+','+(b.y+30) + ' '+(b.x+30)+','+(b.y-8)"
                 fill="#90bce8" stroke="#1f6cb0" stroke-width="1"/>
        <text [attr.x]="b.x+19" [attr.y]="b.y+24" text-anchor="middle"
              font-size="10" fill="#1f6cb0" font-family="sans-serif" font-weight="bold">1000</text>
      }

      <!-- Hundreds group (10×10 small squares = 132×132 total) -->
      @for (b of hundredBlocks(); track $index) {
        @for (row of tenRows(); track row) {
          @for (col of tenCols(); track col) {
            <rect
              [attr.x]="b.x + col * 13"
              [attr.y]="b.y + row * 13"
              width="12"
              height="12"
              fill="#dff0e8"
              stroke="#5c9d6a"
              stroke-width="0.8"
            />
          }
        }
      }

      <!-- Tens group (vertical rod of 10 unit squares) -->
      @for (b of tenBlocks(); track $index) {
        @for (row of tenRows(); track row) {
          <rect
            [attr.x]="b.x"
            [attr.y]="b.y + row * 13"
            width="12"
            height="12"
            fill="#fff3c4"
            stroke="#e2b850"
            stroke-width="0.8"
          />
        }
      }

      <!-- Ones group (single unit squares) -->
      @for (b of oneBlocks(); track $index) {
        <rect
          [attr.x]="b.x"
          [attr.y]="b.y"
          width="12"
          height="12"
          fill="#fcd5d5"
          stroke="#e24c60"
          stroke-width="0.8"
        />
      }

      <!-- Column labels -->
      @if (params().thousands) {
        <text [attr.x]="thousandsX() + 19" [attr.y]="labelY()"
              text-anchor="middle" font-size="11" fill="#1f6cb0"
              font-family="sans-serif">Th</text>
      }
      @if (params().hundreds) {
        <text [attr.x]="hundredsX() + hundredsSectionW() / 2"
              [attr.y]="labelY()"
              text-anchor="middle" font-size="11" fill="#5c9d6a"
              font-family="sans-serif">H</text>
      }
      @if (params().tens) {
        <text [attr.x]="tensX() + tensSectionW() / 2"
              [attr.y]="labelY()"
              text-anchor="middle" font-size="11" fill="#b08020"
              font-family="sans-serif">T</text>
      }
      @if (params().ones) {
        <text [attr.x]="onesX() + onesSectionW() / 2"
              [attr.y]="labelY()"
              text-anchor="middle" font-size="11" fill="#c03048"
              font-family="sans-serif">O</text>
      }
    </svg>
  `,
})
export class Base10BlocksComponent {
  readonly params = input.required<Base10BlocksParams>();

  // ── Grid arrays for @for ──────────────────────────────────────────────────
  protected readonly tenRows = computed(() => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  protected readonly tenCols = computed(() => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

  // ── Section geometry ──────────────────────────────────────────────────────

  private readonly THOU_W = 52;   // width per thousand block (with gap)
  private readonly HUND_W = 145;  // width per hundred block (with gap)
  private readonly TEN_W  = 18;   // width per ten block (with gap)
  private readonly ONE_W  = 18;   // width per one block (with gap)
  private readonly PAD    = 12;
  private readonly TOP    = 12;
  private readonly MAX_H  = 136;  // height of hundreds and tens (132 + some)

  protected readonly hundredsSectionW = computed(
    () => (this.params().hundreds ?? 0) * this.HUND_W
  );
  protected readonly tensSectionW = computed(
    () => (this.params().tens ?? 0) * this.TEN_W
  );
  protected readonly onesSectionW = computed(
    () => (this.params().ones ?? 0) * this.ONE_W
  );

  protected readonly thousandsX = computed(() => this.PAD);

  protected readonly hundredsX = computed(() => {
    const thou = this.params().thousands ?? 0;
    return this.PAD + (thou ? thou * this.THOU_W + 10 : 0);
  });

  protected readonly tensX = computed(
    () => this.hundredsX() + this.hundredsSectionW() + (this.params().hundreds ? 10 : 0)
  );

  protected readonly onesX = computed(
    () => this.tensX() + this.tensSectionW() + (this.params().tens ? 10 : 0)
  );

  protected readonly viewBox = computed(() => {
    const { thousands = 0, hundreds = 0, tens = 0, ones = 0 } = this.params();
    const w =
      this.PAD * 2 +
      thousands * this.THOU_W +
      (thousands ? 10 : 0) +
      hundreds * this.HUND_W +
      (hundreds ? 10 : 0) +
      tens * this.TEN_W +
      (tens ? 10 : 0) +
      ones * this.ONE_W;
    return `0 0 ${Math.max(w, 60)} ${this.MAX_H + 30}`;
  });

  protected readonly labelY = computed(() => this.MAX_H + 26);

  // ── Block position lists ──────────────────────────────────────────────────

  protected readonly thousandBlocks = computed(() => {
    const n = Math.min(this.params().thousands ?? 0, 9);
    const x0 = this.thousandsX();
    return Array.from({ length: n }, (_, i) => ({
      x: x0 + i * this.THOU_W,
      y: this.TOP + 10,
    }));
  });

  protected readonly hundredBlocks = computed(() => {
    const n = Math.min(this.params().hundreds ?? 0, 9);
    const x0 = this.hundredsX();
    return Array.from({ length: n }, (_, i) => ({
      x: x0 + i * this.HUND_W,
      y: this.TOP,
    }));
  });

  protected readonly tenBlocks = computed(() => {
    const n = Math.min(this.params().tens ?? 0, 9);
    const x0 = this.tensX();
    return Array.from({ length: n }, (_, i) => ({
      x: x0 + i * this.TEN_W,
      y: this.TOP,
    }));
  });

  protected readonly oneBlocks = computed(() => {
    const n = Math.min(this.params().ones ?? 0, 9);
    const x0 = this.onesX();
    return Array.from({ length: n }, (_, i) => ({
      x: x0,
      y: this.TOP + i * 15,
    }));
  });
}
