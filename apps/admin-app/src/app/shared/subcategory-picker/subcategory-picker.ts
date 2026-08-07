import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, SubCategoryItem } from '../../services/auth.service';

/**
 * Reusable sub-category tag picker scoped to a (category, difficulty) pair.
 * Lets Admin/Teacher users see the sub-categories available for a question's
 * category + difficulty, toggle them on/off, and create new ones inline.
 * In `readonlyMode`, selection toggling is disabled and it is used purely
 * to surface which sub-categories exist (e.g. on the generate-questions form,
 * where the batch generator distributes across them automatically).
 */
@Component({
  selector: 'app-subcategory-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subcategory-picker.html',
  styleUrl: './subcategory-picker.scss',
})
export class SubCategoryPickerComponent {
  /** Question category key to scope sub-categories to (e.g. 'number-operations') */
  readonly category = input<string | null>(null);
  /** Difficulty tier to scope sub-categories to */
  readonly difficulty = input<'easy' | 'medium' | 'hard'>('medium');
  /** Currently selected sub-category slugs (e.g. when editing an existing question) */
  readonly selected = input<string[]>([]);
  /** When true, selection cannot be toggled — display/creation only */
  readonly readonlyMode = input(false);

  /** Emitted whenever the selected slug list changes */
  readonly selectedChange = output<string[]>();

  private readonly authService = inject(AuthService);

  protected readonly options = signal<SubCategoryItem[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly newName = signal('');
  protected readonly creating = signal(false);

  constructor() {
    effect(() => {
      const category = this.category();
      const difficulty = this.difficulty();
      if (!category) {
        this.options.set([]);
        return;
      }

      this.loading.set(true);
      this.error.set(null);
      this.authService.listSubCategories(category, difficulty).subscribe({
        next: (items) => {
          this.options.set(items);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load sub-categories.');
          this.loading.set(false);
        },
      });
    });
  }

  protected isSelected(slug: string): boolean {
    return this.selected().includes(slug);
  }

  protected toggle(slug: string): void {
    if (this.readonlyMode()) return;

    const current = this.selected();
    const next = this.isSelected(slug)
      ? current.filter((s) => s !== slug)
      : [...current, slug];
    this.selectedChange.emit(next);
  }

  protected createSubCategory(): void {
    const category = this.category();
    const name = this.newName().trim();
    if (!category || !name || this.creating()) return;

    this.creating.set(true);
    this.error.set(null);
    this.authService
      .createSubCategory({ category, difficulty: this.difficulty(), name })
      .subscribe({
        next: (created) => {
          this.options.update((current) => [...current, created]);
          this.newName.set('');
          this.creating.set(false);
          if (!this.readonlyMode()) {
            this.selectedChange.emit([...this.selected(), created.slug]);
          }
        },
        error: (err) => {
          this.error.set(
            err?.error?.message || 'Failed to create sub-category.'
          );
          this.creating.set(false);
        },
      });
  }
}
