import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import {
  Base10BlocksParams,
  DotArrayParams,
  FractionShapeParams,
  GeometryShapeParams,
  NumberLineParams,
  VisualComponentData,
  VisualParams,
} from '../visual-components.model';
import { extractVisualParams } from '../visual-params.util';
import { NumberLineComponent } from '../number-line/number-line';
import { DotArrayComponent } from '../dot-array/dot-array';
import { FractionShapeComponent } from '../fraction-shape/fraction-shape';
import { Geometry2dComponent } from '../geometry-2d/geometry-2d';
import { Base10BlocksComponent } from '../base10-blocks/base10-blocks';
import {
  VisualPlaceholderComponent,
} from '../visual-placeholder/visual-placeholder';

/**
 * Host/dispatcher component for all Maths Mate visual components.
 *
 * Receives a `VisualComponentData` object (from the extracted question JSON)
 * and optional raw text for parameter auto-extraction, then renders the
 * correct visual sub-component.
 *
 * @example
 * ```html
 * <lib-visual-host
 *   [visualData]="question.visual_component"
 *   [questionText]="question.question_text"
 *   [skillDescription]="question.skill_description"
 * />
 * ```
 */
@Component({
  selector: 'lib-visual-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NumberLineComponent,
    DotArrayComponent,
    FractionShapeComponent,
    Geometry2dComponent,
    Base10BlocksComponent,
    VisualPlaceholderComponent,
  ],
  styles: [
    `
      :host {
        display: block;
        padding: 12px 0;
      }
    `,
  ],
  template: `
    @switch (visualData().type) {

      @case ('number_line') {
        <lib-number-line [params]="asNumberLineParams()" />
      }
      @case ('number_line_addition_subtraction') {
        <lib-number-line [params]="asNumberLineParams()" />
      }
      @case ('fraction_number_line') {
        <lib-number-line [params]="asNumberLineParams()" />
      }
      @case ('mixed_number_number_line') {
        <lib-number-line [params]="asNumberLineParams()" />
      }

      @case ('dot_array') {
        <lib-dot-array [params]="asDotArrayParams()" />
      }

      @case ('fraction_shape_shade') {
        <lib-fraction-shape [params]="asFractionShapeParams()" />
      }
      @case ('fraction_shape_divide') {
        <lib-fraction-shape [params]="asFractionShapeParams()" />
      }
      @case ('fraction_shape_recognise') {
        <lib-fraction-shape [params]="asFractionShapeParams()" />
      }

      @case ('geometry_2d_shapes') {
        <lib-geometry-2d [params]="asGeometryParams()" />
      }

      @case ('base_10_blocks') {
        <lib-base10-blocks [params]="asBase10Params()" />
      }

      @default {
        <lib-visual-placeholder [visualData]="visualData()" />
      }

    }
  `,
})
export class VisualHostComponent {
  /** The visual_component data from the extracted question record */
  readonly visualData = input.required<VisualComponentData>();

  /** Raw question text — used for automatic parameter extraction */
  readonly questionText = input('');

  /** Skill description — additional context for parameter extraction */
  readonly skillDescription = input('');

  // ── Resolved params (pre-computed or auto-extracted) ─────────────────────

  private readonly resolvedParams = computed<VisualParams>(() => {
    const data = this.visualData();
    if (data.params && Object.keys(data.params).length > 0) {
      return data.params;
    }
    return extractVisualParams(
      data.type,
      this.questionText(),
      this.skillDescription()
    );
  });

  // ── Typed accessors for each visual component ─────────────────────────────

  protected readonly asNumberLineParams = computed(
    () => this.resolvedParams() as NumberLineParams
  );

  protected readonly asDotArrayParams = computed(
    () => this.resolvedParams() as DotArrayParams
  );

  protected readonly asFractionShapeParams = computed(
    () => this.resolvedParams() as FractionShapeParams
  );

  protected readonly asGeometryParams = computed(
    () => this.resolvedParams() as GeometryShapeParams
  );

  protected readonly asBase10Params = computed(
    () => this.resolvedParams() as Base10BlocksParams
  );
}
