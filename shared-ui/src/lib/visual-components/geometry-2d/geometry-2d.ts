import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { GeometryShapeParams } from '../visual-components.model';

/** Sides count for standard polygon shapes */
const SIDES: Record<string, number> = {
  triangle: 3,
  quadrilateral: 4,
  square: 4,
  rectangle: 4,
  rhombus: 4,
  parallelogram: 4,
  trapezium: 4,
  kite: 4,
  pentagon: 5,
  hexagon: 6,
  heptagon: 7,
  octagon: 8,
  nonagon: 9,
  decagon: 10,
};

/**
 * Renders a labelled 2D shape as an inline SVG.
 *
 * Regular polygons are computed mathematically; special quadrilaterals
 * (rectangle, parallelogram, trapezium, kite, rhombus) use hand-tuned paths.
 */
@Component({
  selector: 'lib-geometry-2d',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host { display: block; }
      svg { width: 100%; height: auto; }
    `,
  ],
  template: `
    <svg viewBox="0 0 180 180" role="img" [attr.aria-label]="ariaLabel()">
      <path
        [attr.d]="shapePath()"
        fill="#e8f0f8"
        stroke="#1f6cb0"
        stroke-width="2"
        stroke-linejoin="round"
      />
      @if (params().showLabel) {
        <text
          x="90"
          y="168"
          text-anchor="middle"
          font-size="12"
          font-family="sans-serif"
          fill="#1f6cb0"
          font-weight="600"
        >
          {{ displayName() }}
        </text>
      }
    </svg>
  `,
})
export class Geometry2dComponent {
  readonly params = input.required<GeometryShapeParams>();

  protected readonly ariaLabel = computed(
    () => `Diagram of a ${this.params().shapeName}`
  );

  protected readonly displayName = computed(() => {
    const name = this.params().shapeName;
    return name.charAt(0).toUpperCase() + name.slice(1);
  });

  protected readonly shapePath = computed(() => {
    const name = this.params().shapeName.toLowerCase();
    const cx = 90;
    const cy = 82;

    // Special shapes
    switch (name) {
      case 'circle':
        return `M ${cx} ${cy - 60} A 60 60 0 1 1 ${cx - 0.01} ${cy - 60} Z`;

      case 'rectangle':
        return rect(cx - 65, cy - 35, 130, 70);

      case 'square':
        return rect(cx - 50, cy - 50, 100, 100);

      case 'rhombus':
        return `M ${cx} ${cy - 55} L ${cx + 55} ${cy} L ${cx} ${cy + 55} L ${cx - 55} ${cy} Z`;

      case 'parallelogram':
        return `M ${cx - 55} ${cy + 35} L ${cx - 20} ${cy - 35} L ${cx + 55} ${cy - 35} L ${cx + 20} ${cy + 35} Z`;

      case 'trapezium':
        return `M ${cx - 50} ${cy + 35} L ${cx - 25} ${cy - 35} L ${cx + 25} ${cy - 35} L ${cx + 50} ${cy + 35} Z`;

      case 'kite':
        return `M ${cx} ${cy - 60} L ${cx + 45} ${cy} L ${cx} ${cy + 55} L ${cx - 45} ${cy} Z`;

      default: {
        // Regular polygon
        const sides = SIDES[name] ?? 6;
        const r = 62;
        // Rotate so flat bottom for even-sided, point up for odd
        const offset = sides % 2 === 0 ? Math.PI / sides : -Math.PI / 2;
        const pts = Array.from({ length: sides }, (_, i) => {
          const angle = offset + (2 * Math.PI * i) / sides;
          return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
        });
        return `M ${pts.join(' L ')} Z`;
      }
    }
  });
}

function rect(x: number, y: number, w: number, h: number): string {
  return `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`;
}
