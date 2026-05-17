import { VisualAssetRegistryService } from './visual-asset-registry.service';

describe('VisualAssetRegistryService', () => {
  let service: VisualAssetRegistryService;

  beforeEach(() => {
    service = new VisualAssetRegistryService();
  });

  it('should load the structured registry manifest for pattern visuals', async () => {
    const assets = await service.listAssets();

    expect(assets.length).toBeGreaterThan(0);
    expect(assets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          assetId: 'pattern.circle.empty',
          format: 'svg',
          roles: ['inline-symbol', 'prompt-illustration'],
        }),
      ])
    );
  });

  it('should filter assets by category and keyword', async () => {
    const assets = await service.findAssets({
      category: 'circle',
      keyword: 'half',
    });

    expect(assets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ assetId: 'pattern.circle.half-left' }),
        expect.objectContaining({ assetId: 'pattern.circle.half-right' }),
      ])
    );
  });

  it('should convert a registry entry into a question visual payload', async () => {
    const visual = await service.toQuestionVisual('pattern.square.full');

    expect(visual).toEqual({
      assetId: 'pattern.square.full',
      role: 'inline-symbol',
      svgPath: '/assets/question-visuals/patterns/full-square.svg',
      templateId: undefined,
      placement: undefined,
    });
  });

  it('should resolve only approved visuals for a curriculum-aligned pattern topic', async () => {
    const visuals = await service.resolveSelectedVisuals(
      { grade: 3, topic: 'PATTERN_RECOGNITION' },
      [
        { assetId: 'pattern.circle.empty', role: 'inline-symbol' },
        { assetId: 'pattern.star.full', role: 'answer-option' },
      ]
    );

    expect(visuals).toEqual([
      expect.objectContaining({
        assetId: 'pattern.circle.empty',
        placement: 'inline',
      }),
    ]);
  });

  it('should provide deterministic default visuals for early patterning topics', async () => {
    const visuals = await service.getDefaultVisualsForTopic({
      grade: 0,
      topic: 'EARLY_PATTERNING',
    });

    expect(visuals).toEqual([
      expect.objectContaining({
        assetId: 'pattern.circle.empty',
        role: 'prompt-illustration',
        placement: 'before-question',
      }),
      expect.objectContaining({
        assetId: 'pattern.circle.full',
        role: 'prompt-illustration',
        placement: 'before-question',
      }),
    ]);
  });

  it('should expose approved shape visuals for Year 0 counting topics', async () => {
    const assets = await service.getGenerationCatalog({
      grade: 0,
      topic: 'COUNTING_AND_QUANTITY',
    });

    expect(assets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ assetId: 'pattern.circle.empty' }),
        expect.objectContaining({ assetId: 'pattern.circle.full' }),
      ])
    );
  });

  it('should preserve duplicate ordered selections for counting visuals', async () => {
    const visuals = await service.resolveSelectedVisuals(
      { grade: 0, topic: 'COUNTING_AND_QUANTITY' },
      [
        { assetId: 'pattern.square.full', role: 'prompt-illustration' },
        { assetId: 'pattern.square.full', role: 'prompt-illustration' },
        { assetId: 'pattern.circle.empty', role: 'prompt-illustration' },
      ]
    );

    expect(visuals).toEqual([
      expect.objectContaining({ assetId: 'pattern.square.full' }),
      expect.objectContaining({ assetId: 'pattern.square.full' }),
      expect.objectContaining({ assetId: 'pattern.circle.empty' }),
    ]);
  });

  it('should provide richer default visuals for higher-grade pattern topics', async () => {
    const visuals = await service.getDefaultVisualsForTopic({
      grade: 3,
      topic: 'PATTERN_RECOGNITION',
    });

    expect(visuals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ assetId: 'pattern.circle.empty' }),
        expect.objectContaining({ assetId: 'pattern.circle.full' }),
        expect.objectContaining({ assetId: 'pattern.circle.half-left' }),
      ])
    );
    expect(
      visuals.every((visual) => visual.role === 'prompt-illustration')
    ).toBe(true);
  });
});
