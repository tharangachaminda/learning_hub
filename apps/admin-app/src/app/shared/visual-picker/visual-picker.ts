import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
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
  assetId: string;
  role:
    | 'inline-symbol'
    | 'prompt-illustration'
    | 'answer-option'
    | 'explanation-aid';
  placement?: 'before-question' | 'after-question' | 'inline' | 'explanation';
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

  /** Emitted whenever the selection list changes. */
  readonly selectionChange = output<PickedVisualSelection[]>();

  private readonly http = inject(HttpClient);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly manifest = signal<VisualRegistryManifest | null>(null);
  protected readonly searchTerm = signal('');
  protected readonly showAllYearsAndTopics = signal(false);
  protected readonly selections = signal<PickedVisualSelection[]>([]);

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
      this.selections.set(this.initialSelections());
    });
  }

  protected isSelected(assetId: string): boolean {
    return this.selections().some((s) => s.assetId === assetId);
  }

  protected getSelection(assetId: string): PickedVisualSelection | undefined {
    return this.selections().find((s) => s.assetId === assetId);
  }

  protected toggleAsset(asset: VisualRegistryAsset): void {
    if (this.isSelected(asset.assetId)) {
      this.removeSelection(asset.assetId);
      return;
    }

    const defaultRole = (asset.roles[0] ??
      'prompt-illustration') as PickedVisualSelection['role'];
    this.selections.update((current) => [
      ...current,
      { assetId: asset.assetId, role: defaultRole },
    ]);
    this.emitSelections();
  }

  protected updateSelectionRole(
    assetId: string,
    role: PickedVisualSelection['role']
  ): void {
    this.selections.update((current) =>
      current.map((s) => (s.assetId === assetId ? { ...s, role } : s))
    );
    this.emitSelections();
  }

  protected removeSelection(assetId: string): void {
    this.selections.update((current) =>
      current.filter((s) => s.assetId !== assetId)
    );
    this.emitSelections();
  }

  protected assetById(assetId: string): VisualRegistryAsset | undefined {
    return this.assets().find((a) => a.assetId === assetId);
  }

  protected trackByAssetId(_index: number, asset: VisualRegistryAsset): string {
    return asset.assetId;
  }

  private emitSelections(): void {
    this.selectionChange.emit(this.selections());
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
