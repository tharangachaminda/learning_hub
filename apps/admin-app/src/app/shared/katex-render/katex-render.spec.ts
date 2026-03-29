import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KatexRenderComponent } from './katex-render';

/**
 * Unit tests for KatexRenderComponent (admin-app).
 *
 * Covers LaTeX preprocessing that fixes common LLM output issues:
 * - Unpaired $ delimiters (missing closing $)
 * - Bare LaTeX commands without $ delimiters
 * - Already-correct LaTeX preserved as-is
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Properly paired LaTeX', () => {
    it('should render inline $...$ expressions', () => {
      fixture.componentRef.setInput('content', 'Solve $8 \\div 4 = ?$');
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const katex = el.querySelectorAll('.katex');
      expect(katex.length).toBe(1);
      expect(el.textContent).toContain('Solve');
    });

    it('should render multiple inline expressions', () => {
      fixture.componentRef.setInput('content', 'Add $3$ and $4$ to get $7$');
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const katex = el.querySelectorAll('.katex');
      expect(katex.length).toBe(3);
    });

    it('should render block $$...$$ expressions', () => {
      fixture.componentRef.setInput(
        'content',
        'Find: $$\\frac{3}{4} + \\frac{1}{2}$$'
      );
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const katex = el.querySelectorAll('.katex');
      expect(katex.length).toBeGreaterThanOrEqual(1);
      expect(el.textContent).toContain('Find:');
    });
  });

  describe('Unpaired $ delimiter fix (LLM issue)', () => {
    it('should render LaTeX when closing $ is missing', () => {
      // LLMs often produce "$8 \\div 4 = ?" without closing $
      fixture.componentRef.setInput('content', '$8 \\div 4 = ?');
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const katex = el.querySelectorAll('.katex');
      expect(katex.length).toBe(1);
      // Should NOT show raw $ or \div
      expect(el.textContent).not.toContain('\\div');
      expect(el.textContent).not.toMatch(/^\$/);
    });

    it('should render LaTeX when closing $ is missing and text precedes', () => {
      fixture.componentRef.setInput('content', 'What is $15 \\div 3 = ?');
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const katex = el.querySelectorAll('.katex');
      expect(katex.length).toBe(1);
      expect(el.textContent).toContain('What is');
      expect(el.textContent).not.toContain('\\div');
    });

    it('should render \\times with missing closing $', () => {
      fixture.componentRef.setInput('content', '$6 \\times 3 = ?');
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const katex = el.querySelectorAll('.katex');
      expect(katex.length).toBe(1);
      expect(el.textContent).not.toContain('\\times');
    });
  });

  describe('Bare LaTeX commands without $ delimiters', () => {
    it('should wrap bare \\div command in $ delimiters', () => {
      fixture.componentRef.setInput('content', '8 \\div 4 = ?');
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const katex = el.querySelectorAll('.katex');
      expect(katex.length).toBe(1);
      expect(el.textContent).not.toContain('\\div');
    });

    it('should wrap bare \\frac command in $ delimiters', () => {
      fixture.componentRef.setInput('content', '\\frac{3}{4}');
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const katex = el.querySelectorAll('.katex');
      expect(katex.length).toBe(1);
    });
  });

  describe('Plain text without LaTeX', () => {
    it('should render plain text unchanged', () => {
      fixture.componentRef.setInput('content', '24 ÷ 4 = ?');
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('24 ÷ 4 = ?');
      // No KaTeX elements should be present
      const katex = el.querySelectorAll('.katex');
      expect(katex.length).toBe(0);
    });

    it('should render empty string without errors', () => {
      fixture.componentRef.setInput('content', '');
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent?.trim()).toBe('');
    });
  });
});
