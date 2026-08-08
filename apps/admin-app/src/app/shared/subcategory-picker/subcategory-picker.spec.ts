import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SubCategoryPickerComponent } from './subcategory-picker';
import { AuthService, SubCategoryItem } from '../../services/auth.service';

/**
 * Unit tests for SubCategoryPickerComponent (admin-app).
 *
 * Covers the tag add/remove/inline-create flow used on the question
 * create/edit and generate-questions forms (see
 * openspec/changes/add-question-subcategory-tagging).
 */
describe('SubCategoryPickerComponent', () => {
  let component: SubCategoryPickerComponent;
  let fixture: ComponentFixture<SubCategoryPickerComponent>;
  let authService: jest.Mocked<
    Pick<
      AuthService,
      'listSubCategories' | 'createSubCategory' | 'updateSubCategory'
    >
  >;

  const existingOptions: SubCategoryItem[] = [
    {
      _id: 'sc-1',
      category: 'number-operations',
      difficulty: 'medium',
      name: 'Skip Counting',
      slug: 'skip-counting',
      description: 'Counting up or down in equal steps, e.g. 2s, 5s, 10s',
      createdBy: 'teacher@example.com',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      _id: 'sc-2',
      category: 'number-operations',
      difficulty: 'medium',
      name: 'Word Problems',
      slug: 'word-problems',
      createdBy: 'teacher@example.com',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  beforeEach(async () => {
    authService = {
      listSubCategories: jest.fn().mockReturnValue(of(existingOptions)),
      createSubCategory: jest.fn(),
      updateSubCategory: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SubCategoryPickerComponent],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compileComponents();

    fixture = TestBed.createComponent(SubCategoryPickerComponent);
    component = fixture.componentInstance;
  });

  function setInputs(overrides: {
    category?: string | null;
    difficulty?: 'easy' | 'medium' | 'hard';
    selected?: string[];
    readonlyMode?: boolean;
  }): void {
    fixture.componentRef.setInput(
      'category',
      overrides.category ?? 'number-operations'
    );
    fixture.componentRef.setInput('difficulty', overrides.difficulty ?? 'medium');
    fixture.componentRef.setInput('selected', overrides.selected ?? []);
    fixture.componentRef.setInput('readonlyMode', overrides.readonlyMode ?? false);
    fixture.detectChanges();
  }

  it('should create', () => {
    setInputs({});
    expect(component).toBeTruthy();
  });

  it('loads sub-categories for the given category + difficulty', () => {
    setInputs({});

    expect(authService.listSubCategories).toHaveBeenCalledWith(
      'number-operations',
      'medium'
    );
    const chips = fixture.nativeElement.querySelectorAll(
      '.subcategory-chip'
    ) as NodeListOf<HTMLButtonElement>;
    expect(chips.length).toBe(2);
    expect(chips[0].textContent).toContain('Skip Counting');
  });

  it('emits the slug added when an unselected chip is clicked', () => {
    setInputs({ selected: [] });
    const emitted = jest.spyOn(component.selectedChange, 'emit');

    const chips = fixture.nativeElement.querySelectorAll(
      '.subcategory-chip'
    ) as NodeListOf<HTMLButtonElement>;
    chips[0].click();

    expect(emitted).toHaveBeenCalledWith(['skip-counting']);
  });

  it('emits the slug removed when a selected chip is clicked', () => {
    setInputs({ selected: ['skip-counting', 'word-problems'] });
    const emitted = jest.spyOn(component.selectedChange, 'emit');

    const chips = fixture.nativeElement.querySelectorAll(
      '.subcategory-chip'
    ) as NodeListOf<HTMLButtonElement>;
    chips[0].click();

    expect(emitted).toHaveBeenCalledWith(['word-problems']);
  });

  it('does not emit when toggling a chip in readonly mode', () => {
    setInputs({ readonlyMode: true });
    const emitted = jest.spyOn(component.selectedChange, 'emit');

    const chips = fixture.nativeElement.querySelectorAll(
      '.subcategory-chip'
    ) as NodeListOf<HTMLButtonElement>;
    chips[0].click();

    expect(emitted).not.toHaveBeenCalled();
  });

  it('creates a new sub-category with a description and adds it to the selection', () => {
    const created: SubCategoryItem = {
      _id: 'sc-3',
      category: 'number-operations',
      difficulty: 'medium',
      name: 'Number Lines',
      slug: 'number-lines',
      description: 'Using a number line to add or subtract',
      createdBy: 'teacher@example.com',
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    authService.createSubCategory.mockReturnValue(of(created));
    setInputs({ selected: ['skip-counting'] });
    const emitted = jest.spyOn(component.selectedChange, 'emit');

    const inputs = fixture.nativeElement.querySelectorAll(
      '.subcategory-create input'
    ) as NodeListOf<HTMLInputElement>;
    inputs[0].value = 'Number Lines';
    inputs[0].dispatchEvent(new Event('input'));
    inputs[1].value = 'Using a number line to add or subtract';
    inputs[1].dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const addButton = fixture.nativeElement.querySelector(
      '.subcategory-create button'
    ) as HTMLButtonElement;
    addButton.click();

    expect(authService.createSubCategory).toHaveBeenCalledWith({
      category: 'number-operations',
      difficulty: 'medium',
      name: 'Number Lines',
      description: 'Using a number line to add or subtract',
    });
    expect(emitted).toHaveBeenCalledWith(['skip-counting', 'number-lines']);
  });

  it('disables the Add button until both name and description are filled', () => {
    setInputs({});

    const addButton = fixture.nativeElement.querySelector(
      '.subcategory-create button'
    ) as HTMLButtonElement;
    expect(addButton.disabled).toBe(true);

    const inputs = fixture.nativeElement.querySelectorAll(
      '.subcategory-create input'
    ) as NodeListOf<HTMLInputElement>;
    inputs[0].value = 'Number Lines';
    inputs[0].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(addButton.disabled).toBe(true);

    inputs[1].value = 'Using a number line to add or subtract';
    inputs[1].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(addButton.disabled).toBe(false);
  });

  it('shows an "add description" affordance only for chips missing one', () => {
    setInputs({});

    const descButtons = fixture.nativeElement.querySelectorAll(
      '.subcategory-desc-btn'
    );
    // Skip Counting has a description, Word Problems does not
    expect(descButtons.length).toBe(1);
  });

  it('backfills a missing description via the inline editor', () => {
    const updated: SubCategoryItem = {
      ...existingOptions[1],
      description: 'Real-world scenarios expressed as arithmetic problems',
    };
    authService.updateSubCategory.mockReturnValue(of(updated));
    setInputs({});

    const descButton = fixture.nativeElement.querySelector(
      '.subcategory-desc-btn'
    ) as HTMLButtonElement;
    descButton.click();
    fixture.detectChanges();

    const editorInput = fixture.nativeElement.querySelector(
      '.subcategory-desc-editor input'
    ) as HTMLInputElement;
    editorInput.value = 'Real-world scenarios expressed as arithmetic problems';
    editorInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const saveButton = fixture.nativeElement.querySelector(
      '.subcategory-desc-editor .btn-secondary'
    ) as HTMLButtonElement;
    saveButton.click();

    expect(authService.updateSubCategory).toHaveBeenCalledWith(
      'sc-2',
      'Real-world scenarios expressed as arithmetic problems'
    );
  });

  it('does not show the "add description" affordance in readonly mode', () => {
    setInputs({ readonlyMode: true });

    const descButtons = fixture.nativeElement.querySelectorAll(
      '.subcategory-desc-btn'
    );
    expect(descButtons.length).toBe(0);
  });
});
