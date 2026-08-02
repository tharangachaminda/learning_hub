import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';
import { VisualComponentData } from '../visual-components.model';

/**
 * Fallback displayed for visual types not yet implemented.
 * Shows the description text so the student still has context.
 */
@Component({
  selector: 'lib-visual-placeholder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [VisualTypeLabelPipe],
  styles: [
    `
      :host { display: block; }
      .placeholder {
        border: 2px dashed #9ba3a8;
        border-radius: 8px;
        padding: 12px 16px;
        background: #f8fafc;
        color: #666;
        font-size: 13px;
        font-style: italic;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
      }
      .placeholder__icon {
        font-size: 24px;
      }
      .placeholder__type {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        color: #9ba3a8;
      }
    `,
  ],
  template: `
    <div class="placeholder" [attr.aria-label]="visualData().description">
      <span class="placeholder__icon">🖼️</span>
      <span class="placeholder__type">{{ visualData().type | visualTypeLabel }}</span>
      <span>{{ visualData().description }}</span>
    </div>
  `,
})
export class VisualPlaceholderComponent {
  readonly visualData = input.required<VisualComponentData>();
}

// Simple pipe so we don't need an extra file
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'visualTypeLabel', standalone: true })
export class VisualTypeLabelPipe implements PipeTransform {
  transform(type: string): string {
    return type.replace(/_/g, ' ');
  }
}
