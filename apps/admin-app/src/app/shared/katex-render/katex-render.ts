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
    // Pre-process to fix common LLM issues (unpaired $, bare LaTeX commands)
    const preprocessed = this.preprocessLatex(text);

    // First, process block LaTeX ($$...$$)
    let result = preprocessed.replace(/\$\$([\s\S]*?)\$\$/g, (_, latex) => {
      return this.renderExpression(latex.trim(), true);
    });

    // Then, process inline LaTeX ($...$), avoiding already-processed blocks
    result = result.replace(
      /(?<!\$)\$(?!\$)((?:[^$\\]|\\.)*?)\$(?!\$)/g,
      (_, latex) => {
        return this.renderExpression(latex, false);
      }
    );

    // Convert newlines to <br> for HTML rendering
    result = result.replace(/\n/g, '<br>');

    return result;
  }

  /**
   * Fixes common LaTeX formatting issues from LLM output:
   * - Unpaired `$` delimiters (e.g., `$8 \div 4 = ?` missing closing `$`)
   * - Bare LaTeX commands without any `$` delimiters
   */
  private preprocessLatex(text: string): string {
    if (!text) return text;

    // Handle block delimiters first — replace $$ pairs with placeholders
    const blockPlaceholders: string[] = [];
    let processed = text.replace(/\$\$([\s\S]*?)\$\$/g, (match) => {
      blockPlaceholders.push(match);
      return `__BLOCK_${blockPlaceholders.length - 1}__`;
    });

    // Count remaining single $ (inline delimiters)
    const singleDollars: number[] = [];
    for (let i = 0; i < processed.length; i++) {
      if (
        processed[i] === '$' &&
        !processed.substring(i).startsWith('__BLOCK_')
      ) {
        singleDollars.push(i);
      }
    }

    if (singleDollars.length % 2 !== 0) {
      // Odd number of $ — find the unpaired one and close it
      // Most common LLM issue: opening $ without closing $
      const lastDollar = singleDollars[singleDollars.length - 1];
      const afterDollar = processed.substring(lastDollar + 1).trimEnd();
      if (afterDollar.length > 0) {
        // Content after the last $ — add closing $ at the end
        processed = processed.trimEnd() + '$';
      } else {
        // $ at the very end with no content — likely a stray $, remove it
        processed =
          processed.substring(0, lastDollar) +
          processed.substring(lastDollar + 1);
      }
    }

    // If no $ delimiters at all but contains LaTeX commands, wrap the expression
    const latexCommandRe =
      /\\(?:div|times|frac|sqrt|cdot|pm|mp|leq|geq|neq|approx|sum|prod|int|left|right|over|text)\b/;
    if (!processed.includes('$') && latexCommandRe.test(processed)) {
      // Try to isolate the math expression (numbers and operators)
      processed = processed.replace(
        /((?:\d+\s*)?\\(?:div|times|frac|sqrt|cdot|pm|mp|leq|geq|neq|approx|sum|prod|int|left|right|over|text)\b[\s\S]*)/,
        (match) => `$${match.trim()}$`
      );
    }

    // Restore block placeholders
    for (let i = 0; i < blockPlaceholders.length; i++) {
      processed = processed.replace(`__BLOCK_${i}__`, blockPlaceholders[i]);
    }

    return processed;
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
