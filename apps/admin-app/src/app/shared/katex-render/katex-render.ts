import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as katex from 'katex';

/**
 * Reusable component that renders LaTeX expressions using KaTeX.
 *
 * Supports inline (`$...$`) and block (`$$...$$`) LaTeX within mixed text content.
 * Falls back to raw text display if KaTeX parsing fails.
 *
 * @example
 * ```html
 * <app-katex-render [content]="'Solve $x + 2 = 5$'" />
 * ```
 */
@Component({
  selector: 'app-katex-render',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <span class="katex-render" [innerHTML]="renderedHtml()"></span> `,
  styles: [
    `
      :host {
        display: inline;
      }
      .katex-render {
        line-height: 1.6;
      }
      .katex-fallback {
        font-family: monospace;
        color: #666;
      }
    `,
  ],
})
export class KatexRenderComponent {
  private readonly sanitizer = inject(DomSanitizer);

  /** The text content that may contain LaTeX expressions. */
  readonly content = input<string>('');

  /**
   * Computed SafeHtml with LaTeX expressions rendered via KaTeX.
   */
  readonly renderedHtml = computed<SafeHtml>(() => {
    const raw = this.content();
    if (!raw) return '';
    const html = this.renderLatex(raw);
    return this.sanitizer.bypassSecurityTrustHtml(html);
  });

  /**
   * Processes a string containing LaTeX expressions and renders them via KaTeX.
   * Handles block (`$$...$$`) and inline (`$...$`) expressions.
   */
  private renderLatex(text: string): string {
    // First, process block LaTeX ($$...$$)
    let result = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, latex) => {
      return this.renderExpression(latex.trim(), true);
    });

    // Then, process inline LaTeX ($...$), avoiding already-processed blocks
    result = result.replace(
      /(?<!\$)\$(?!\$)((?:[^$\\]|\\.)*?)\$(?!\$)/g,
      (_, latex) => {
        return this.renderExpression(latex, false);
      }
    );

    return result;
  }

  /**
   * Renders a single LaTeX expression via KaTeX.
   */
  private renderExpression(latex: string, displayMode: boolean): string {
    try {
      return katex.renderToString(latex, {
        displayMode,
        throwOnError: false,
        output: 'html',
      });
    } catch {
      return `<span class="katex-fallback">${this.escapeHtml(latex)}</span>`;
    }
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
