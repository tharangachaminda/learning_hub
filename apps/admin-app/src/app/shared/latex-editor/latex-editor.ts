import {
  Component,
  input,
  output,
  inject,
  ElementRef,
  viewChild,
  OnDestroy,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { KatexRenderComponent } from '../katex-render/katex-render';

import { EditorState } from '@codemirror/state';
import {
  EditorView,
  keymap,
  placeholder as cmPlaceholder,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { bracketMatching } from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';

interface ToolbarItem {
  label: string;
  title: string;
  before: string;
  after: string;
  type: 'wrap' | 'insert';
}

@Component({
  selector: 'app-latex-editor',
  standalone: true,
  imports: [CommonModule, KatexRenderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './latex-editor.html',
  styleUrl: './latex-editor.scss',
})
export class LatexEditorComponent implements AfterViewInit, OnDestroy {
  /** The text content (may contain LaTeX). */
  readonly content = input<string>('');
  /** Placeholder text when empty. */
  readonly placeholder = input<string>('');
  /** Minimum editor height in rows (each ~1.6em). */
  readonly rows = input<number>(6);

  /** Emitted on every content change. */
  readonly contentChange = output<string>();

  private editorContainer = viewChild<ElementRef>('editorContainer');
  private editorView: EditorView | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly cdr = inject(ChangeDetectorRef);

  /** Current text for the live preview, updated via debounce. */
  previewText = '';

  /** Whether to show the preview pane. */
  showPreview = true;

  // ── Toolbar definitions ──────────────────────────────────────

  readonly textTools: ToolbarItem[] = [
    {
      label: 'B',
      title: 'Bold (Ctrl+B)',
      before: '\\textbf{',
      after: '}',
      type: 'wrap',
    },
    {
      label: 'I',
      title: 'Italic (Ctrl+I)',
      before: '\\textit{',
      after: '}',
      type: 'wrap',
    },
    {
      label: 'U',
      title: 'Underline',
      before: '\\underline{',
      after: '}',
      type: 'wrap',
    },
  ];

  readonly mathTools: ToolbarItem[] = [
    {
      label: '$',
      title: 'Inline Math (Ctrl+M)',
      before: '$',
      after: '$',
      type: 'wrap',
    },
    {
      label: '$$',
      title: 'Block Math',
      before: '$$',
      after: '$$',
      type: 'wrap',
    },
    {
      label: '÷',
      title: 'Fraction',
      before: '\\frac{',
      after: '}{}',
      type: 'wrap',
    },
    {
      label: 'x²',
      title: 'Superscript',
      before: '^{',
      after: '}',
      type: 'wrap',
    },
    { label: 'x₂', title: 'Subscript', before: '_{', after: '}', type: 'wrap' },
    {
      label: '√',
      title: 'Square Root',
      before: '\\sqrt{',
      after: '}',
      type: 'wrap',
    },
  ];

  readonly symbolTools: ToolbarItem[] = [
    {
      label: '×',
      title: 'Times',
      before: '\\times ',
      after: '',
      type: 'insert',
    },
    {
      label: '÷',
      title: 'Divide',
      before: '\\div ',
      after: '',
      type: 'insert',
    },
    {
      label: '±',
      title: 'Plus-minus',
      before: '\\pm ',
      after: '',
      type: 'insert',
    },
    {
      label: '≤',
      title: 'Less-equal',
      before: '\\leq ',
      after: '',
      type: 'insert',
    },
    {
      label: '≥',
      title: 'Greater-equal',
      before: '\\geq ',
      after: '',
      type: 'insert',
    },
    {
      label: '≠',
      title: 'Not-equal',
      before: '\\neq ',
      after: '',
      type: 'insert',
    },
    { label: 'π', title: 'Pi', before: '\\pi ', after: '', type: 'insert' },
  ];

  ngAfterViewInit(): void {
    this.initEditor();
  }

  ngOnDestroy(): void {
    this.editorView?.destroy();
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }

  /** Toggle preview panel visibility. */
  togglePreview(): void {
    this.showPreview = !this.showPreview;
    this.cdr.markForCheck();
  }

  /** Toolbar button click handler. */
  applyTool(tool: ToolbarItem): void {
    if (!this.editorView) return;
    const view = this.editorView;
    const { from, to } = view.state.selection.main;
    const selected = view.state.sliceDoc(from, to);

    let insertText: string;
    let cursorPos: number;

    if (tool.type === 'wrap' && selected) {
      insertText = tool.before + selected + tool.after;
      cursorPos = from + insertText.length;
    } else {
      insertText = tool.before + tool.after;
      cursorPos = from + tool.before.length;
    }

    view.dispatch({
      changes: { from, to, insert: insertText },
      selection: { anchor: cursorPos },
    });
    view.focus();
  }

  // ── Private ──────────────────────────────────────────────────

  private initEditor(): void {
    const container = this.editorContainer()?.nativeElement;
    if (!container) return;

    const initialContent = this.content() || '';
    this.previewText = initialContent;

    const self = this;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const text = update.state.doc.toString();
        self.onContentChange(text);
      }
    });

    const customKeymap = keymap.of([
      {
        key: 'Mod-b',
        run: (view) => {
          self.wrapSelection(view, '\\textbf{', '}');
          return true;
        },
      },
      {
        key: 'Mod-i',
        run: (view) => {
          self.wrapSelection(view, '\\textit{', '}');
          return true;
        },
      },
      {
        key: 'Mod-m',
        run: (view) => {
          self.wrapSelection(view, '$', '$');
          return true;
        },
      },
    ]);

    const minHeight = EditorView.theme({
      '.cm-editor': { minHeight: `${this.rows() * 1.6}em` },
      '.cm-content': { minHeight: `${this.rows() * 1.6}em` },
      '.cm-scroller': { overflow: 'auto' },
    });

    const state = EditorState.create({
      doc: initialContent,
      extensions: [
        customKeymap,
        keymap.of([...defaultKeymap, ...historyKeymap]),
        history(),
        markdown(),
        bracketMatching(),
        EditorView.lineWrapping,
        cmPlaceholder(
          this.placeholder() || 'Enter text with LaTeX (e.g. $x^2 + 1$)...'
        ),
        minHeight,
        updateListener,
      ],
    });

    this.editorView = new EditorView({ state, parent: container });
  }

  private wrapSelection(view: EditorView, before: string, after: string): void {
    const { from, to } = view.state.selection.main;
    const selected = view.state.sliceDoc(from, to);
    const insertText = before + selected + after;
    const cursorPos = selected
      ? from + insertText.length
      : from + before.length;
    view.dispatch({
      changes: { from, to, insert: insertText },
      selection: { anchor: cursorPos },
    });
  }

  private onContentChange(text: string): void {
    this.contentChange.emit(text);
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.previewText = text;
      this.cdr.markForCheck();
    }, 300);
  }
}
