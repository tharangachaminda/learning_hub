import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
  inject,
  SecurityContext,
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
 *
 * @example
 * ```html
 * <app-katex-render [content]="'Find: $$\\frac{3}{4}$$'" />
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
      .katex-render :global(.katex-display) {
        margin: 0.5em 0;
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
   * Uses DomSanitizer.bypassSecurityTrustHtml because KaTeX generates
   * complex HTML with inline styles that Angular's sanitizer would strip.
   *
   * @returns SafeHtml with LaTeX converted to KaTeX markup
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
   * Falls back to raw text on KaTeX parsing errors.
   *
   * @param text - The raw text potentially containing LaTeX expressions
   * @returns HTML string with LaTeX rendered via KaTeX
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
   * Returns raw text wrapped in a fallback span if parsing fails.
   *
   * @param latex - The LaTeX expression (without delimiters)
   * @param displayMode - Whether to render in display mode (block) vs inline
   * @returns KaTeX-rendered HTML string, or fallback raw text
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

  /**
   * Escapes HTML special characters for safe insertion.
   *
   * @param text - Raw text to escape
   * @returns HTML-escaped text
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
