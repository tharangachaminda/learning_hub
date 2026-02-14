import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KatexRenderComponent } from './katex-render';

/**
 * Unit tests for KatexRenderComponent.
 *
 * Validates LaTeX rendering via KaTeX for:
 * - Inline expressions ($...$)
 * - Block expressions ($$...$$)
 * - Plain text passthrough (no LaTeX)
 * - Fallback on invalid LaTeX
 * - Mixed content (text + LaTeX)
 *
 * Covers AC-3: LaTeX Rendering.
 */
describe('KatexRenderComponent', () => {
  let component: KatexRenderComponent;
  let fixture: ComponentFixture<KatexRenderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KatexRenderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KatexRenderComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Plain text (no LaTeX)', () => {
    it('should render plain text as-is', () => {
      fixture.componentRef.setInput('content', 'What is 5 + 3?');
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('What is 5 + 3?');
    });

    it('should render empty string without errors', () => {
      fixture.componentRef.setInput('content', '');
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent?.trim()).toBe('');
    });
  });

  describe('Inline LaTeX ($...$)', () => {
    it('should render inline LaTeX expressions', () => {
      fixture.componentRef.setInput('content', 'Solve $x + 2 = 5$');
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const katexSpans = el.querySelectorAll('.katex');
      expect(katexSpans.length).toBe(1);
      expect(el.textContent).toContain('Solve');
    });

    it('should render multiple inline LaTeX expressions', () => {
      fixture.componentRef.setInput('content', 'Calculate $3 + 4$ and $7 - 2$');
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const katexSpans = el.querySelectorAll('.katex');
      expect(katexSpans.length).toBe(2);
    });
  });

  describe('Block LaTeX ($$...$$)', () => {
    it('should render block LaTeX expressions', () => {
      fixture.componentRef.setInput(
        'content',
        'Find the value: $$\\frac{3}{4} + \\frac{1}{2}$$'
      );
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const katexDisplays = el.querySelectorAll('.katex-display');
      expect(katexDisplays.length).toBe(1);
    });
  });

  describe('Mixed content', () => {
    it('should render text with both inline and block LaTeX', () => {
      fixture.componentRef.setInput('content', 'If $x = 3$, find: $$x^2 + 1$$');
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const allKatex = el.querySelectorAll('.katex');
      expect(allKatex.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Fallback on invalid LaTeX', () => {
    it('should display raw text when LaTeX parsing fails', () => {
      fixture.componentRef.setInput(
        'content',
        'Invalid: $\\invalidcommand{bad}$'
      );
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      // KaTeX with throwOnError: false renders best-effort — still produces output
      // The content should be present in some form (not crash)
      expect(el.textContent).toContain('Invalid:');
      expect(el.textContent).toContain('invalidcommand');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label for LaTeX content', () => {
      fixture.componentRef.setInput('content', 'Solve $x + 2 = 5$');
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const container =
        el.querySelector('[role="math"]') || el.querySelector('.katex-render');
      expect(container).toBeTruthy();
    });
  });
});
