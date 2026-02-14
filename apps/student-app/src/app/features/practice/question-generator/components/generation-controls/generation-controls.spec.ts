/**
 * Test Suite: GenerationControlsComponent
 *
 * Validates generation controls render correctly with proper defaults,
 * user interactions (grade/topic dropdowns, difficulty
 * toggle, count slider, generate button), and event emissions.
 */
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { GenerationControlsComponent } from './generation-controls';
import {
  GRADE_TOPICS,
  QUESTION_TYPE_DISPLAY_NAMES,
} from '../../models/curriculum.data';
import { GenerationParams } from '../../models/generation-params.model';

describe('GenerationControlsComponent', () => {
  let component: GenerationControlsComponent;
  let fixture: ComponentFixture<GenerationControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenerationControlsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GenerationControlsComponent);
    component = fixture.componentInstance;
    component.grade = 3;
    component.country = 'NZ';
    component.isGenerating = false;
    component.serviceHealthy = true;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ────────────────────────────────────────────────────
  // AC#2: Grade Dropdown
  // ────────────────────────────────────────────────────
  describe('Grade Dropdown (AC#2)', () => {
    it('should render a grade dropdown', () => {
      const select = fixture.nativeElement.querySelector(
        '[data-testid="grade-select"]'
      );
      expect(select).toBeTruthy();
    });

    it('should pre-fill from profile grade (3)', () => {
      expect(component.selectedGrade()).toBe(3);
    });

    it('should have options for grades 3 through 8', () => {
      const select: HTMLSelectElement = fixture.nativeElement.querySelector(
        '[data-testid="grade-select"]'
      );
      const options = Array.from(select.options);
      expect(options).toHaveLength(6);
      expect(options.map((o) => o.text.trim())).toEqual([
        'Grade 3',
        'Grade 4',
        'Grade 5',
        'Grade 6',
        'Grade 7',
        'Grade 8',
      ]);
    });

    it('should update selectedGrade when grade changes', () => {
      component.onGradeChange(5);
      expect(component.selectedGrade()).toBe(5);
    });

    it('should reset topic to first available when grade changes', () => {
      component.onGradeChange(5);
      const expectedFirst = GRADE_TOPICS[5].mathematics[0];
      expect(component.selectedTopic()).toBe(expectedFirst);
    });
  });

  // ────────────────────────────────────────────────────
  // AC#3: Topic Dropdown
  // ────────────────────────────────────────────────────
  describe('Topic Dropdown (AC#3)', () => {
    it('should render a topic dropdown', () => {
      const select = fixture.nativeElement.querySelector(
        '[data-testid="topic-select"]'
      );
      expect(select).toBeTruthy();
    });

    it('should show topics for the selected grade', () => {
      const topics = component.availableTopics();
      expect(topics).toEqual(GRADE_TOPICS[3].mathematics);
    });

    it('should auto-select the first topic', () => {
      expect(component.selectedTopic()).toBe('ADDITION');
    });

    it('should show user-friendly display names', () => {
      const select: HTMLSelectElement = fixture.nativeElement.querySelector(
        '[data-testid="topic-select"]'
      );
      const optionTexts = Array.from(select.options).map((o) => o.text.trim());
      expect(optionTexts[0]).toBe(QUESTION_TYPE_DISPLAY_NAMES['ADDITION']);
      expect(optionTexts[1]).toBe(QUESTION_TYPE_DISPLAY_NAMES['SUBTRACTION']);
    });

    it('should refresh topic list when grade changes', () => {
      component.onGradeChange(4);
      fixture.detectChanges();
      const topics = component.availableTopics();
      expect(topics).toEqual(GRADE_TOPICS[4].mathematics);
    });

    it('should update selected topic when user selects a different topic', () => {
      component.onTopicChange('SUBTRACTION');
      expect(component.selectedTopic()).toBe('SUBTRACTION');
    });
  });

  // ────────────────────────────────────────────────────
  // AC#5: Difficulty Toggle
  // ────────────────────────────────────────────────────
  describe('Difficulty Toggle (AC#5)', () => {
    it('should render 3 difficulty buttons', () => {
      const toggle = fixture.nativeElement.querySelector(
        '[data-testid="difficulty-toggle"]'
      );
      const buttons = toggle.querySelectorAll('.difficulty-btn');
      expect(buttons.length).toBe(3);
    });

    it('should default to easy selected', () => {
      expect(component.selectedDifficulty()).toBe('easy');
    });

    it('should show Easy as selected with correct styling', () => {
      const easyBtn = fixture.nativeElement.querySelector(
        '[data-testid="difficulty-easy"]'
      );
      expect(easyBtn.classList.contains('selected')).toBe(true);
    });

    it('should allow single-select between difficulties', () => {
      component.onDifficultySelect('hard');
      fixture.detectChanges();

      const easyBtn = fixture.nativeElement.querySelector(
        '[data-testid="difficulty-easy"]'
      );
      const hardBtn = fixture.nativeElement.querySelector(
        '[data-testid="difficulty-hard"]'
      );
      expect(easyBtn.classList.contains('selected')).toBe(false);
      expect(hardBtn.classList.contains('selected')).toBe(true);
    });

    it('should have aria-pressed on selected difficulty', () => {
      const easyBtn = fixture.nativeElement.querySelector(
        '[data-testid="difficulty-easy"]'
      );
      expect(easyBtn.getAttribute('aria-pressed')).toBe('true');
    });

    it('should have difficulty colour classes', () => {
      const easyBtn = fixture.nativeElement.querySelector(
        '[data-testid="difficulty-easy"]'
      );
      const medBtn = fixture.nativeElement.querySelector(
        '[data-testid="difficulty-medium"]'
      );
      const hardBtn = fixture.nativeElement.querySelector(
        '[data-testid="difficulty-hard"]'
      );
      expect(easyBtn.classList.contains('difficulty-easy')).toBe(true);
      expect(medBtn.classList.contains('difficulty-medium')).toBe(true);
      expect(hardBtn.classList.contains('difficulty-hard')).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────
  // AC#6: Question Count Slider
  // ────────────────────────────────────────────────────
  describe('Question Count Slider (AC#6)', () => {
    it('should render a range slider', () => {
      const slider = fixture.nativeElement.querySelector(
        '[data-testid="count-slider"]'
      );
      expect(slider).toBeTruthy();
      expect(slider.type).toBe('range');
    });

    it('should have range 5 to 25 with step 5', () => {
      const slider: HTMLInputElement = fixture.nativeElement.querySelector(
        '[data-testid="count-slider"]'
      );
      expect(slider.min).toBe('5');
      expect(slider.max).toBe('25');
      expect(slider.step).toBe('5');
    });

    it('should default to 10', () => {
      expect(component.selectedCount()).toBe(10);
    });

    it('should show count badge with current value', () => {
      const badge = fixture.nativeElement.querySelector(
        '[data-testid="count-badge"]'
      );
      expect(badge.textContent.trim()).toBe('10');
    });

    it('should update badge when count changes', () => {
      component.onCountChange(20);
      fixture.detectChanges();
      const badge = fixture.nativeElement.querySelector(
        '[data-testid="count-badge"]'
      );
      expect(badge.textContent.trim()).toBe('20');
    });
  });

  // ────────────────────────────────────────────────────
  // AC#7: Generate Button
  // ────────────────────────────────────────────────────
  describe('Generate Button (AC#7)', () => {
    it('should render a generate button', () => {
      const btn = fixture.nativeElement.querySelector(
        '[data-testid="generate-btn"]'
      );
      expect(btn).toBeTruthy();
    });

    it('should be enabled when a topic is selected', () => {
      const btn: HTMLButtonElement = fixture.nativeElement.querySelector(
        '[data-testid="generate-btn"]'
      );
      expect(btn.disabled).toBe(false);
    });

    it('should be disabled when no topic is selected', () => {
      component.selectedTopic.set('');
      fixture.detectChanges();
      const btn: HTMLButtonElement = fixture.nativeElement.querySelector(
        '[data-testid="generate-btn"]'
      );
      expect(btn.disabled).toBe(true);
    });

    it('should show "🚀 Generate Questions" text', () => {
      const btn = fixture.nativeElement.querySelector(
        '[data-testid="generate-btn"]'
      );
      expect(btn.textContent.trim()).toContain('Generate Questions');
    });

    it('should show brain icon with spinner when isGenerating', () => {
      component.isGenerating = true;
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector(
        '[data-testid="generate-btn"]'
      );
      expect(btn.textContent.trim()).toContain('🧠');
      const spinner = btn.querySelector('.btn-spinner');
      expect(spinner).toBeTruthy();
    });

    it('should emit generate event with correct params on click', () => {
      const generateSpy = jest.spyOn(component.generate, 'emit');
      component.onGenerateClick();

      expect(generateSpy).toHaveBeenCalledWith({
        grade: 3,
        topic: 'ADDITION',
        difficulty: 'easy',
        count: 10,
        country: 'NZ',
      } as GenerationParams);
    });

    it('should not emit when no topic is selected', () => {
      component.selectedTopic.set('');
      const generateSpy = jest.spyOn(component.generate, 'emit');
      component.onGenerateClick();
      expect(generateSpy).not.toHaveBeenCalled();
    });

    it('should disable all controls when isGenerating', fakeAsync(() => {
      fixture.componentRef.setInput('isGenerating', true);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const gradeSelect: HTMLSelectElement =
        fixture.nativeElement.querySelector('[data-testid="grade-select"]');
      const topicSelect: HTMLSelectElement =
        fixture.nativeElement.querySelector('[data-testid="topic-select"]');
      const slider: HTMLInputElement = fixture.nativeElement.querySelector(
        '[data-testid="count-slider"]'
      );

      expect(gradeSelect.disabled).toBe(true);
      expect(topicSelect.disabled).toBe(true);
      expect(slider.disabled).toBe(true);
    }));

    it('should be disabled when service is unhealthy', () => {
      component.serviceHealthy = false;
      fixture.detectChanges();
      const btn: HTMLButtonElement = fixture.nativeElement.querySelector(
        '[data-testid="generate-btn"]'
      );
      expect(btn.disabled).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────
  // AC#8: Country (Hidden)
  // ────────────────────────────────────────────────────
  describe('Country (AC#8)', () => {
    it('should include country in generated params', () => {
      const generateSpy = jest.spyOn(component.generate, 'emit');
      component.onGenerateClick();
      expect(generateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ country: 'NZ' })
      );
    });

    it('should fall back to NZ when country is empty', () => {
      component.country = '';
      const generateSpy = jest.spyOn(component.generate, 'emit');
      component.onGenerateClick();
      expect(generateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ country: 'NZ' })
      );
    });

    it('should not display country field anywhere in the template', () => {
      const text = fixture.nativeElement.textContent;
      // country label should not appear visually
      expect(text).not.toContain('Country');
    });
  });
});
