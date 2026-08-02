import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  untracked,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

/** A visual asset entry as published in the static question-visuals registry. */
interface VisualRegistryAsset {
  assetId: string;
  displayName: string;
  altText: string;
  semanticText: string;
  subjects: string[];
  categories: string[];
  supportedTopics: string[];
  yearLevels: number[];
  keywords: string[];
  roles: string[];
  format: 'svg';
  source: { kind: 'file' | 'template'; svgPath?: string; templateId?: string };
}

interface VisualRegistryManifest {
  metadata: { version: string; source: string; generatedAt?: string };
  assets: VisualRegistryAsset[];
}

/** A visual selection as sent to the create-question API. */
export interface PickedVisualSelection {
  selectionId: string;
  assetId: string;
  role:
    | 'inline-symbol'
    | 'prompt-illustration'
    | 'answer-option'
    | 'explanation-aid';
  placement?: 'before-question' | 'after-question' | 'inline' | 'explanation';
  displayName?: string;
  svgPath?: string;
  render?: {
    width?: number;
    height?: number;
  };
  layout?: {
    row?: number;
    column?: number;
  };
}

/** Ordered preview metadata for selected visuals. */
export interface PickedVisualPreview {
  selectionId: string;
  assetId: string;
  displayName: string;
  svgPath?: string;
}

/**
 * Reusable picker for attaching existing question-visual registry assets
 * (SVG image library) to a manually created question. Purely opt-in —
 * no visual is required and nothing is auto-selected.
 */
@Component({
  selector: 'app-visual-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './visual-picker.html',
  styleUrl: './visual-picker.scss',
})
export class VisualPickerComponent {
  /** Grade used to narrow the catalog to relevant assets (optional filter only). */
  readonly grade = input<number | null>(null);
  /** Topic key used to narrow the catalog to relevant assets (optional filter only). */
  readonly topic = input<string>('');
  /** Previously selected visuals, e.g. when editing a draft. */
  readonly initialSelections = input<PickedVisualSelection[]>([]);
  /** Incrementing token used by the parent to clear the current selection. */
  readonly resetToken = input(0);

  /** Emitted whenever the selection list changes. */
  readonly selectionChange = output<PickedVisualSelection[]>();
  /** Emitted whenever ordered preview visuals change. */
  readonly selectionPreviewChange = output<PickedVisualPreview[]>();

  private readonly http = inject(HttpClient);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly manifest = signal<VisualRegistryManifest | null>(null);
  protected readonly searchTerm = signal('');
  protected readonly showAllYearsAndTopics = signal(false);
  protected readonly selections = signal<PickedVisualSelection[]>([]);
  private lastResetToken = 0;

  protected readonly assets = computed(() => this.manifest()?.assets ?? []);

  protected readonly filteredAssets = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const grade = this.grade();
    const topic = this.topic();
    const relaxFilters = this.showAllYearsAndTopics();

    return this.assets().filter((asset) => {
      if (!relaxFilters) {
        if (
          grade !== null &&
          asset.yearLevels.length > 0 &&
          !asset.yearLevels.includes(grade)
        ) {
          return false;
        }
        if (
          topic &&
          asset.supportedTopics.length > 0 &&
          !asset.supportedTopics.includes(topic)
        ) {
          return false;
        }
      }

      if (!search) {
        return true;
      }

      const haystack = [
        asset.assetId,
        asset.displayName,
        asset.altText,
        asset.semanticText,
        ...asset.keywords,
        ...asset.categories,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(search);
    });
  });

  constructor() {
    this.loadManifest();

    effect(() => {
      const selections = this.initialSelections().map((selection) => ({
        ...selection,
        selectionId:
          selection.selectionId ?? this.createSelectionId(selection.assetId),
      }));
      this.selections.set(selections);
      untracked(() => this.emitSelections());
    });

    effect(() => {
      const resetToken = this.resetToken();
      if (resetToken === this.lastResetToken) {
        return;
      }

      this.lastResetToken = resetToken;
      this.selections.set([]);
      untracked(() => this.emitSelections());
    });
  }

  protected isSelected(assetId: string): boolean {
    return this.selections().some((s) => s.assetId === assetId);
  }

  protected getSelection(
    selectionId: string
  ): PickedVisualSelection | undefined {
    return this.selections().find((s) => s.selectionId === selectionId);
  }

  protected toggleAsset(asset: VisualRegistryAsset): void {
    this.addSelection(asset);
  }

  protected moveSelection(selectionId: string, direction: 'up' | 'down'): void {
    this.selections.update((current) => {
      const index = current.findIndex((s) => s.selectionId === selectionId);
      if (index < 0) return current;

      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= current.length) return current;

      const next = [...current];
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
    });

    this.emitSelections();
  }

  private addSelection(asset: VisualRegistryAsset): void {
    const defaultRole = (asset.roles[0] ??
      'prompt-illustration') as PickedVisualSelection['role'];
    this.selections.update((current) => [
      ...current,
      {
        selectionId: this.createSelectionId(asset.assetId),
        assetId: asset.assetId,
        role: defaultRole,
        displayName: asset.displayName,
        svgPath: asset.source.svgPath,
      },
    ]);
    this.emitSelections();
  }

  protected updateSelectionRole(
    selectionId: string,
    role: PickedVisualSelection['role']
  ): void {
    this.selections.update((current) =>
      current.map((s) => (s.selectionId === selectionId ? { ...s, role } : s))
    );
    this.emitSelections();
  }

  protected removeSelection(selectionId: string): void {
    this.selections.update((current) =>
      current.filter((s) => s.selectionId !== selectionId)
    );
    this.emitSelections();
  }

  protected assetById(assetId: string): VisualRegistryAsset | undefined {
    return this.assets().find((a) => a.assetId === assetId);
  }

  protected trackByAssetId(_index: number, asset: VisualRegistryAsset): string {
    return asset.assetId;
  }

  protected trackBySelectionId(
    _index: number,
    selection: PickedVisualSelection
  ): string {
    return selection.selectionId;
  }

  private emitSelections(): void {
    const selections = this.selections();
    this.selectionChange.emit(selections);
    this.selectionPreviewChange.emit(
      selections.map((selection) => ({
        selectionId: selection.selectionId,
        assetId: selection.assetId,
        displayName: selection.displayName ?? selection.assetId,
        svgPath: selection.svgPath,
      }))
    );
  }

  private createSelectionId(assetId: string): string {
    return `${assetId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private loadManifest(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http
      .get<VisualRegistryManifest>('/assets/question-visuals/registry.json')
      .subscribe({
        next: (manifest) => {
          this.manifest.set(manifest);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load the visual asset library.');
          this.loading.set(false);
        },
      });
  }
}
