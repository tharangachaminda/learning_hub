import { Injectable, Logger } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  LLMSelectedVisual,
  QuestionVisual,
  VisualAssetRegistryEntry,
  VisualAssetRegistryEntrySchema,
  VisualAssetRegistryManifest,
  VisualAssetRegistryManifestSchema,
  VisualAssetRole,
} from './schemas';

type LegacySymbolRecord = {
  symbol: string;
  name: string;
  category: string;
  fraction: string;
};

type LegacySymbolDataset = {
  metadata?: {
    version?: string;
  };
  symbols?: LegacySymbolRecord[];
};

@Injectable()
export class VisualAssetRegistryService {
  private readonly logger = new Logger(VisualAssetRegistryService.name);
  private readonly registryPath = join(
    process.cwd(),
    'shared-assets',
    'question-visuals',
    'registry.json'
  );
  private readonly legacySymbolsPath = join(
    process.cwd(),
    'dev_resources',
    'question_symbols.json'
  );

  private registryCache: VisualAssetRegistryManifest | null = null;

  async listAssets(): Promise<VisualAssetRegistryEntry[]> {
    const registry = await this.loadRegistry();
    return registry.assets;
  }

  async getAssetById(
    assetId: string
  ): Promise<VisualAssetRegistryEntry | null> {
    const registry = await this.loadRegistry();
    return registry.assets.find((asset) => asset.assetId === assetId) ?? null;
  }

  async findAssets(filters: {
    subject?: string;
    category?: string;
    keyword?: string;
    role?: VisualAssetRole;
  }): Promise<VisualAssetRegistryEntry[]> {
    const registry = await this.loadRegistry();
    const normalizedKeyword = filters.keyword?.toLowerCase();

    return registry.assets.filter((asset) => {
      if (filters.subject && !asset.subjects.includes(filters.subject)) {
        return false;
      }

      if (filters.category && !asset.categories.includes(filters.category)) {
        return false;
      }

      if (filters.role && !asset.roles.includes(filters.role)) {
        return false;
      }

      if (normalizedKeyword) {
        const haystack = [
          asset.displayName,
          asset.altText,
          asset.semanticText,
          ...asset.keywords,
        ].map((value) => value.toLowerCase());

        if (!haystack.some((value) => value.includes(normalizedKeyword))) {
          return false;
        }
      }

      return true;
    });
  }

  async getGenerationCatalog(request: {
    grade: number;
    topic: string;
  }): Promise<VisualAssetRegistryEntry[]> {
    const registry = await this.loadRegistry();
    const supportedTopics = this.getSupportedTopicsForRequest(request.topic);

    return registry.assets.filter((asset) => {
      const topicMatches =
        asset.supportedTopics.length === 0 ||
        asset.supportedTopics.some((topic) => supportedTopics.has(topic));
      const yearMatches =
        asset.yearLevels.length === 0 ||
        asset.yearLevels.includes(request.grade);

      return topicMatches && yearMatches;
    });
  }

  async resolveSelectedVisuals(
    request: { grade: number; topic: string },
    selectedVisuals: LLMSelectedVisual[]
  ): Promise<QuestionVisual[]> {
    if (selectedVisuals.length === 0) {
      return [];
    }

    const approvedAssets = await this.getGenerationCatalog(request);
    const approvedById = new Map(
      approvedAssets.map((asset) => [asset.assetId, asset])
    );
    const resolvedVisuals: QuestionVisual[] = [];
    const seenAssetIds = new Set<string>();

    for (const visual of selectedVisuals) {
      const asset = approvedById.get(visual.assetId);

      if (!asset || seenAssetIds.has(visual.assetId)) {
        continue;
      }

      if (!asset.roles.includes(visual.role)) {
        continue;
      }

      const questionVisual = await this.toQuestionVisual(visual.assetId, {
        role: visual.role,
        placement: this.defaultPlacementForRole(visual.role),
      });

      if (questionVisual) {
        resolvedVisuals.push(questionVisual);
        seenAssetIds.add(visual.assetId);
      }

      if (resolvedVisuals.length >= 4) {
        break;
      }
    }

    return resolvedVisuals;
  }

  async getDefaultVisualsForTopic(request: {
    grade: number;
    topic: string;
  }): Promise<QuestionVisual[]> {
    const approvedAssets = await this.getGenerationCatalog(request);

    if (approvedAssets.length === 0) {
      return [];
    }

    const preferredShapeOrder = ['circle', 'square', 'triangle', 'diamond'];
    const preferredStateOrder =
      request.grade <= 1
        ? ['empty', 'full']
        : ['empty', 'full', 'half-left', 'half-right'];

    for (const shape of preferredShapeOrder) {
      const matchedAssets = preferredStateOrder
        .map((state) =>
          approvedAssets.find(
            (asset) =>
              asset.categories.includes(shape) &&
              asset.assetId.endsWith(`.${state}`)
          )
        )
        .filter((asset): asset is VisualAssetRegistryEntry => Boolean(asset));

      const requiredCount = request.grade <= 1 ? 2 : 3;
      if (matchedAssets.length >= requiredCount) {
        return Promise.all(
          matchedAssets.slice(0, 4).map((asset) =>
            this.toQuestionVisual(asset.assetId, {
              role: 'prompt-illustration',
              placement: 'before-question',
            })
          )
        ).then((visuals) =>
          visuals.filter((visual): visual is QuestionVisual => Boolean(visual))
        );
      }
    }

    return Promise.all(
      approvedAssets.slice(0, Math.min(4, approvedAssets.length)).map((asset) =>
        this.toQuestionVisual(asset.assetId, {
          role: 'prompt-illustration',
          placement: 'before-question',
        })
      )
    ).then((visuals) =>
      visuals.filter((visual): visual is QuestionVisual => Boolean(visual))
    );
  }

  async toQuestionVisual(
    assetId: string,
    overrides: Partial<QuestionVisual> = {}
  ): Promise<QuestionVisual | null> {
    const asset = await this.getAssetById(assetId);

    if (!asset) {
      return null;
    }

    return {
      assetId: asset.assetId,
      role: overrides.role ?? asset.roles[0],
      label: overrides.label ?? asset.displayName,
      altText: overrides.altText ?? asset.altText,
      subject: overrides.subject ?? asset.subjects[0],
      keywords: overrides.keywords ?? asset.keywords,
      svgPath: overrides.svgPath ?? asset.source.svgPath,
      templateId: overrides.templateId ?? asset.source.templateId,
      placement: overrides.placement,
    };
  }

  private async loadRegistry(): Promise<VisualAssetRegistryManifest> {
    if (this.registryCache) {
      return this.registryCache;
    }

    const registry = await this.readPrimaryRegistry();
    this.registryCache = registry;
    return registry;
  }

  private async readPrimaryRegistry(): Promise<VisualAssetRegistryManifest> {
    try {
      const raw = await readFile(this.registryPath, 'utf8');
      return VisualAssetRegistryManifestSchema.parse(JSON.parse(raw));
    } catch {
      this.logger.log(
        'Structured visual asset registry not found. Falling back to legacy question_symbols.json.'
      );
      return this.buildLegacyRegistry();
    }
  }

  private async buildLegacyRegistry(): Promise<VisualAssetRegistryManifest> {
    const raw = await readFile(this.legacySymbolsPath, 'utf8');
    const dataset = JSON.parse(raw) as LegacySymbolDataset;
    const symbols = dataset.symbols ?? [];

    return VisualAssetRegistryManifestSchema.parse({
      metadata: {
        version: dataset.metadata?.version ?? 'legacy-adapter',
        source: 'question_symbols.json',
      },
      assets: symbols.map((symbol) => this.mapLegacySymbol(symbol)),
    });
  }

  private mapLegacySymbol(
    symbol: LegacySymbolRecord
  ): VisualAssetRegistryEntry {
    return VisualAssetRegistryEntrySchema.parse({
      assetId: `legacy.${symbol.category}.${this.slugify(symbol.name)}`,
      displayName: symbol.name,
      altText: `${symbol.name} (${symbol.fraction})`,
      semanticText: `${symbol.name} ${symbol.category} fraction ${symbol.fraction}`,
      subjects: ['mathematics'],
      categories: [symbol.category, 'pattern-recognition'],
      supportedTopics: ['PATTERN_RECOGNITION'],
      yearLevels: [3, 4, 5],
      keywords: [
        symbol.category,
        symbol.fraction,
        symbol.name,
        'legacy-symbol',
      ],
      roles: ['inline-symbol', 'prompt-illustration'],
      format: 'svg',
      source: {
        kind: 'template',
        templateId: 'legacy-geometric-symbol',
        legacySymbol: symbol.symbol,
        templateData: {
          category: symbol.category,
          fraction: symbol.fraction,
          name: symbol.name,
        },
      },
    });
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private getSupportedTopicsForRequest(topic: string): Set<string> {
    const normalizedTopic = topic.toUpperCase();
    const supportedTopics = new Set<string>([normalizedTopic]);

    if (
      normalizedTopic === 'COUNTING_AND_QUANTITY' ||
      normalizedTopic === 'EARLY_OPERATIONS'
    ) {
      supportedTopics.add('EARLY_PATTERNING');
      supportedTopics.add('PATTERN_RECOGNITION');
    }

    return supportedTopics;
  }

  private defaultPlacementForRole(role: QuestionVisual['role']) {
    switch (role) {
      case 'prompt-illustration':
        return 'before-question';
      case 'explanation-aid':
        return 'explanation';
      case 'answer-option':
        return 'after-question';
      case 'inline-symbol':
      default:
        return 'inline';
    }
  }
}
