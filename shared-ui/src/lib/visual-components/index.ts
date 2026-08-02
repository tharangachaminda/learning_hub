// Models
export * from './visual-components.model';

// Parameter extraction utility
export { extractVisualParams } from './visual-params.util';

// Individual visual renderers
export { NumberLineComponent } from './number-line/number-line';
export { DotArrayComponent } from './dot-array/dot-array';
export { FractionShapeComponent } from './fraction-shape/fraction-shape';
export { Geometry2dComponent } from './geometry-2d/geometry-2d';
export { Base10BlocksComponent } from './base10-blocks/base10-blocks';
export {
  VisualPlaceholderComponent,
  VisualTypeLabelPipe,
} from './visual-placeholder/visual-placeholder';

// Host dispatcher (use this in your templates)
export { VisualHostComponent } from './visual-host/visual-host';
