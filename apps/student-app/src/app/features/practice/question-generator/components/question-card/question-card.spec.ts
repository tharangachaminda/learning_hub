import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuestionCardComponent } from './question-card';
import { GeneratedQuestion } from '../../models/question.model';

/**
 * Unit tests for QuestionCardComponent.
 *
 * Validates AC-2: Question Card Display
 * - Question counter ("📝 Question X of N")
 * - Difficulty badge (pill: green/amber/red)
 * - Question text with LaTeX rendering via KatexRenderComponent
 * - Card styling (left border, .question-card class)
 */
describe('QuestionCardComponent', () => {
  let component: QuestionCardComponent;
  let fixture: ComponentFixture<QuestionCardComponent>;

  const mockQuestion: GeneratedQuestion = {
    question: 'What is $\\frac{3}{4} + \\frac{1}{2}$?',
    answer: 1.25,
    explanation: 'Find a common denominator. 3/4 + 2/4 = 5/4 = 1.25',
    metadata: {
      grade: 3,
      topic: 'ADDITION',
      difficulty: 'easy',
      country: 'NZ',
      generated_by: 'ollama',
      generation_time: 400,
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionCardComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.componentRef.setInput('question', mockQuestion);
    fixture.componentRef.setInput('questionNumber', 1);
    fixture.componentRef.setInput('totalQuestions', 10);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('Question Counter (AC-2)', () => {
    it('should display "📝 Question X of N" header', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('questionNumber', 3);
      fixture.componentRef.setInput('totalQuestions', 10);
      fixture.detectChanges();

      const header = fixture.nativeElement.querySelector(
        '[data-testid="question-counter"]'
      );
      expect(header).toBeTruthy();
      expect(header.textContent).toContain('Question 3 of 10');
    });

    it('should update counter when inputs change', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('questionNumber', 1);
      fixture.componentRef.setInput('totalQuestions', 5);
      fixture.detectChanges();

      const header = fixture.nativeElement.querySelector(
        '[data-testid="question-counter"]'
      );
      expect(header.textContent).toContain('Question 1 of 5');
    });
  });

  describe('Difficulty Badge (AC-2)', () => {
    it('should display easy difficulty badge with green styling', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('questionNumber', 1);
      fixture.componentRef.setInput('totalQuestions', 10);
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector(
        '[data-testid="difficulty-badge"]'
      );
      expect(badge).toBeTruthy();
      expect(badge.textContent?.trim().toLowerCase()).toContain('easy');
      expect(badge.classList.contains('badge-easy')).toBe(true);
    });

    it('should display medium difficulty badge', () => {
      const mediumQ = {
        ...mockQuestion,
        metadata: { ...mockQuestion.metadata, difficulty: 'medium' },
      };
      fixture.componentRef.setInput('question', mediumQ);
      fixture.componentRef.setInput('questionNumber', 1);
      fixture.componentRef.setInput('totalQuestions', 10);
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector(
        '[data-testid="difficulty-badge"]'
      );
      expect(badge.textContent?.trim().toLowerCase()).toContain('medium');
      expect(badge.classList.contains('badge-medium')).toBe(true);
    });

    it('should display hard difficulty badge', () => {
      const hardQ = {
        ...mockQuestion,
        metadata: { ...mockQuestion.metadata, difficulty: 'hard' },
      };
      fixture.componentRef.setInput('question', hardQ);
      fixture.componentRef.setInput('questionNumber', 1);
      fixture.componentRef.setInput('totalQuestions', 10);
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector(
        '[data-testid="difficulty-badge"]'
      );
      expect(badge.textContent?.trim().toLowerCase()).toContain('hard');
      expect(badge.classList.contains('badge-hard')).toBe(true);
    });
  });

  describe('Question Text with LaTeX (AC-2, AC-3)', () => {
    it('should render question text via KatexRenderComponent', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('questionNumber', 1);
      fixture.componentRef.setInput('totalQuestions', 10);
      fixture.detectChanges();

      const katexEl = fixture.nativeElement.querySelector('app-katex-render');
      expect(katexEl).toBeTruthy();
    });

    it('should render LaTeX expressions in question text', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('questionNumber', 1);
      fixture.componentRef.setInput('totalQuestions', 10);
      fixture.detectChanges();

      const katexSpans = fixture.nativeElement.querySelectorAll('.katex');
      expect(katexSpans.length).toBeGreaterThanOrEqual(1);
    });

    it('should render plain text questions without errors', () => {
      const plainQ = {
        ...mockQuestion,
        question: 'What is 5 + 3?',
      };
      fixture.componentRef.setInput('question', plainQ);
      fixture.componentRef.setInput('questionNumber', 1);
      fixture.componentRef.setInput('totalQuestions', 10);
      fixture.detectChanges();

      const katexEl = fixture.nativeElement.querySelector('app-katex-render');
      expect(katexEl).toBeTruthy();
      expect(katexEl.textContent).toContain('What is 5 + 3?');
    });
  });

  describe('Card Styling (AC-2)', () => {
    it('should have question-card class on the card element', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('questionNumber', 1);
      fixture.componentRef.setInput('totalQuestions', 10);
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector('.question-card');
      expect(card).toBeTruthy();
    });
  });

  // ────────────────────────────────────────────────────
  // AC#4: Multiple-Choice Options
  // ────────────────────────────────────────────────────
  describe('Multiple-Choice Options (AC-4)', () => {
    const options = [
      '$\\frac{5}{4}$',
      '$\\frac{7}{4}$',
      '$\\frac{1}{4}$',
      '$\\frac{3}{2}$',
    ];

    function setupWithOptions(): void {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('questionNumber', 1);
      fixture.componentRef.setInput('totalQuestions', 10);
      fixture.componentRef.setInput('options', options);
      fixture.detectChanges();
    }

    it('should render 4 option buttons', () => {
      setupWithOptions();
      const optionEls = fixture.nativeElement.querySelectorAll(
        '[data-testid^="option-"]'
      );
      expect(optionEls.length).toBe(4);
    });

    it('should display letter badges (A, B, C, D)', () => {
      setupWithOptions();
      const badges = fixture.nativeElement.querySelectorAll('.option-badge');
      expect(badges.length).toBe(4);
      expect(badges[0].textContent?.trim()).toBe('A');
      expect(badges[1].textContent?.trim()).toBe('B');
      expect(badges[2].textContent?.trim()).toBe('C');
      expect(badges[3].textContent?.trim()).toBe('D');
    });

    it('should render option text with LaTeX via KatexRender', () => {
      setupWithOptions();
      const optionKatex = fixture.nativeElement.querySelectorAll(
        '.option-text app-katex-render'
      );
      expect(optionKatex.length).toBe(4);
    });

    it('should emit optionSelected event on option click', () => {
      setupWithOptions();
      const spy = jest.fn();
      component.optionSelected.subscribe(spy);

      const firstOption = fixture.nativeElement.querySelector(
        '[data-testid="option-A"]'
      );
      firstOption.click();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledWith('A');
    });

    it('should highlight selected option with selected class', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('questionNumber', 1);
      fixture.componentRef.setInput('totalQuestions', 10);
      fixture.componentRef.setInput('options', options);
      fixture.componentRef.setInput('selectedOption', 'B');
      fixture.detectChanges();

      const selectedEl = fixture.nativeElement.querySelector(
        '[data-testid="option-B"]'
      );
      expect(selectedEl.classList.contains('option-selected')).toBe(true);
    });

    it('should not highlight unselected options', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('questionNumber', 1);
      fixture.componentRef.setInput('totalQuestions', 10);
      fixture.componentRef.setInput('options', options);
      fixture.componentRef.setInput('selectedOption', 'B');
      fixture.detectChanges();

      const unselected = fixture.nativeElement.querySelector(
        '[data-testid="option-A"]'
      );
      expect(unselected.classList.contains('option-selected')).toBe(false);
    });

    it('should show options grid container', () => {
      setupWithOptions();
      const grid = fixture.nativeElement.querySelector('.options-grid');
      expect(grid).toBeTruthy();
    });
  });

  // ────────────────────────────────────────────────────
  // AC#5: Textarea for Additional Notes
  // ────────────────────────────────────────────────────
  describe('Textarea for Additional Notes (AC-5)', () => {
    function setup(): void {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('questionNumber', 1);
      fixture.componentRef.setInput('totalQuestions', 10);
      fixture.detectChanges();
    }

    it('should render textarea with "Additional notes (optional)" label', () => {
      setup();
      const label = fixture.nativeElement.querySelector(
        '[data-testid="notes-label"]'
      );
      expect(label).toBeTruthy();
      expect(label.textContent).toContain('Additional notes (optional)');
    });

    it('should have textarea with 3 rows', () => {
      setup();
      const textarea = fixture.nativeElement.querySelector(
        '[data-testid="notes-textarea"]'
      ) as HTMLTextAreaElement;
      expect(textarea).toBeTruthy();
      expect(textarea.rows).toBe(3);
    });

    it('should have maxlength of 500 characters', () => {
      setup();
      const textarea = fixture.nativeElement.querySelector(
        '[data-testid="notes-textarea"]'
      ) as HTMLTextAreaElement;
      expect(textarea.maxLength).toBe(500);
    });

    it('should display character count indicator', () => {
      setup();
      const charCount = fixture.nativeElement.querySelector(
        '[data-testid="char-count"]'
      );
      expect(charCount).toBeTruthy();
      expect(charCount.textContent).toContain('0 / 500');
    });

    it('should update character count when text is entered', () => {
      setup();
      const textarea = fixture.nativeElement.querySelector(
        '[data-testid="notes-textarea"]'
      ) as HTMLTextAreaElement;

      textarea.value = 'Hello world';
      textarea.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      const charCount = fixture.nativeElement.querySelector(
        '[data-testid="char-count"]'
      );
      expect(charCount.textContent).toContain('11 / 500');
    });

    it('should emit notesChanged event when text is entered', () => {
      setup();
      const spy = jest.fn();
      component.notesChanged.subscribe(spy);

      const textarea = fixture.nativeElement.querySelector(
        '[data-testid="notes-textarea"]'
      ) as HTMLTextAreaElement;

      textarea.value = 'I used estimation';
      textarea.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledWith('I used estimation');
    });

    it('should have aria-label on textarea', () => {
      setup();
      const textarea = fixture.nativeElement.querySelector(
        '[data-testid="notes-textarea"]'
      ) as HTMLTextAreaElement;
      expect(textarea.getAttribute('aria-label')).toBeTruthy();
    });
  });

  // ────────────────────────────────────────────────────
  // Hint Toggle (AC-2: "💡 Show Hint")
  // ────────────────────────────────────────────────────
  describe('Hint Toggle', () => {
    function setup(): void {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('questionNumber', 1);
      fixture.componentRef.setInput('totalQuestions', 10);
      fixture.detectChanges();
    }

    it('should render "💡 Show Hint" toggle button', () => {
      setup();
      const hintBtn = fixture.nativeElement.querySelector(
        '[data-testid="hint-toggle"]'
      );
      expect(hintBtn).toBeTruthy();
      expect(hintBtn.textContent).toContain('Show Hint');
    });

    it('should hide hint content by default', () => {
      setup();
      const hintContent = fixture.nativeElement.querySelector(
        '[data-testid="hint-content"]'
      );
      expect(hintContent).toBeFalsy();
    });

    it('should show hint content when toggle is clicked', () => {
      setup();
      const hintBtn = fixture.nativeElement.querySelector(
        '[data-testid="hint-toggle"]'
      );
      hintBtn.click();
      fixture.detectChanges();

      const hintContent = fixture.nativeElement.querySelector(
        '[data-testid="hint-content"]'
      );
      expect(hintContent).toBeTruthy();
      expect(hintContent.textContent).toContain(mockQuestion.explanation);
    });

    it('should change button text to "💡 Hide Hint" when expanded', () => {
      setup();
      const hintBtn = fixture.nativeElement.querySelector(
        '[data-testid="hint-toggle"]'
      );
      hintBtn.click();
      fixture.detectChanges();

      expect(hintBtn.textContent).toContain('Hide Hint');
    });

    it('should hide hint content when toggle is clicked again', () => {
      setup();
      const hintBtn = fixture.nativeElement.querySelector(
        '[data-testid="hint-toggle"]'
      );
      hintBtn.click();
      fixture.detectChanges();
      hintBtn.click();
      fixture.detectChanges();

      const hintContent = fixture.nativeElement.querySelector(
        '[data-testid="hint-content"]'
      );
      expect(hintContent).toBeFalsy();
    });

    it('should emit hintToggled event when hint is shown', () => {
      setup();
      const spy = jest.fn();
      component.hintToggled.subscribe(spy);

      const hintBtn = fixture.nativeElement.querySelector(
        '[data-testid="hint-toggle"]'
      );
      hintBtn.click();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledWith(true);
    });

    it('should accept hintExpanded input for persistence', () => {
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('questionNumber', 1);
      fixture.componentRef.setInput('totalQuestions', 10);
      fixture.componentRef.setInput('hintExpanded', true);
      fixture.detectChanges();

      const hintContent = fixture.nativeElement.querySelector(
        '[data-testid="hint-content"]'
      );
      expect(hintContent).toBeTruthy();
    });
  });
});
