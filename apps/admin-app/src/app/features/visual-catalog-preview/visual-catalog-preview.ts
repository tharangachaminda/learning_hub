import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowsRotate,
  faLayerGroup,
  faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons';

interface VisualCatalogSource {
  kind: 'file' | 'template';
  svgPath?: string;
  templateId?: string;
}

interface VisualCatalogAsset {
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
  source: VisualCatalogSource;
}

interface VisualCatalogManifest {
  metadata: {
    version: string;
    source: string;
    generatedAt?: string;
  };
  assets: VisualCatalogAsset[];
}

@Component({
  selector: 'app-visual-catalog-preview',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './visual-catalog-preview.html',
  styleUrl: './visual-catalog-preview.scss',
})
export class VisualCatalogPreviewComponent implements OnInit {
  private readonly http = inject(HttpClient);

  protected readonly searchIcon = faMagnifyingGlass;
  protected readonly catalogIcon = faLayerGroup;
  protected readonly resetIcon = faArrowsRotate;

  protected readonly manifest = signal<VisualCatalogManifest | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly searchTerm = signal('');
  protected readonly selectedCategory = signal('');
  protected readonly selectedTopic = signal('');
  protected readonly selectedYear = signal<number | null>(null);

  protected readonly assets = computed(() => this.manifest()?.assets ?? []);

  protected readonly categories = computed(() =>
    Array.from(
      new Set(this.assets().flatMap((asset) => asset.categories))
    ).sort()
  );

  protected readonly topics = computed(() =>
    Array.from(
      new Set(this.assets().flatMap((asset) => asset.supportedTopics))
    ).sort()
  );

  protected readonly years = computed(() =>
    Array.from(
      new Set(this.assets().flatMap((asset) => asset.yearLevels))
    ).sort((left, right) => left - right)
  );

  protected readonly filteredAssets = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const category = this.selectedCategory();
    const topic = this.selectedTopic();
    const year = this.selectedYear();

    return this.assets().filter((asset) => {
      if (category && !asset.categories.includes(category)) {
        return false;
      }

      if (topic && !asset.supportedTopics.includes(topic)) {
        return false;
      }

      if (year !== null && !asset.yearLevels.includes(year)) {
        return false;
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
        ...asset.supportedTopics,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(search);
    });
  });

  ngOnInit(): void {
    this.loadManifest();
  }

  protected setSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  protected setCategory(value: string): void {
    this.selectedCategory.set(value);
  }

  protected setTopic(value: string): void {
    this.selectedTopic.set(value);
  }

  protected setYear(value: string): void {
    this.selectedYear.set(value ? Number(value) : null);
  }

  protected resetFilters(): void {
    this.searchTerm.set('');
    this.selectedCategory.set('');
    this.selectedTopic.set('');
    this.selectedYear.set(null);
  }

  protected trackByAssetId(_index: number, asset: VisualCatalogAsset): string {
    return asset.assetId;
  }

  private loadManifest(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http
      .get<VisualCatalogManifest>('/assets/question-visuals/registry.json')
      .subscribe({
        next: (manifest) => {
          this.manifest.set(manifest);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load the visual catalog manifest.');
          this.loading.set(false);
        },
      });
  }
}
