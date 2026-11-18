import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BattlecardService } from './battlecard.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('BattlecardService', () => {
  let service: BattlecardService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      competitor: {
        findMany: vi.fn(),
      },
    };

    service = new BattlecardService(prismaMock as unknown as PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate a comprehensive battlecard payload with metrics and feature matrix', async () => {
    prismaMock.competitor.findMany.mockResolvedValue([
      {
        id: 'comp-1',
        url: 'https://alpha.com',
        createdAt: new Date('2026-10-01'),
        snapshots: [
          {
            id: 'snap-1',
            pageTitle: 'Alpha - Next-Gen Intelligence',
            capturedAt: new Date('2026-10-10'),
          },
        ],
        changes: Array(15).fill({ id: 'chg-1', detectedAt: new Date() }),
        pricing: [
          {
            id: 'price-1',
            name: 'Starter',
            price: '$10',
            period: 'monthly',
            features: JSON.stringify(['API Access', 'Automated Change Alerts']),
          },
          {
            id: 'price-2',
            name: 'Pro',
            price: '$49',
            period: 'monthly',
            features: JSON.stringify(['Dedicated SLA', 'Custom crawling']),
          },
        ],
      },
      {
        id: 'comp-2',
        url: 'https://beta.org',
        createdAt: new Date('2026-10-02'),
        snapshots: [
          {
            id: 'snap-2',
            pageTitle: 'Beta Documentation',
            capturedAt: new Date('2026-10-11'),
          },
        ],
        changes: Array(2).fill({ id: 'chg-2', detectedAt: new Date() }),
        pricing: [],
      },
    ]);

    const result = await service.generateBattlecard();

    expect(result.totalCompetitors).toBe(2);
    expect(result.mostActiveCompetitor).toBe('alpha.com');
    expect(result.lowestEntryPrice).toBe('$10/mo');

    // Check competitor summaries
    const alpha = result.competitors.find((c) => c.domain === 'alpha.com');
    expect(alpha).toBeDefined();
    expect(alpha?.velocity).toBe('HIGH');
    expect(alpha?.totalChanges).toBe(15);
    expect(alpha?.pricingTiers.length).toBe(2);

    const beta = result.competitors.find((c) => c.domain === 'beta.org');
    expect(beta).toBeDefined();
    expect(beta?.velocity).toBe('LOW');
    expect(beta?.totalChanges).toBe(2);

    // Check Feature Matrix
    expect(result.featureMatrix.length).toBeGreaterThanOrEqual(3);
    const slaFeature = result.featureMatrix.find((f) => f.feature === 'Dedicated SLA');
    expect(slaFeature).toBeDefined();
    expect(slaFeature?.availability['alpha.com']).toBe(true);
    expect(slaFeature?.availability['beta.org']).toBe(false);

    // Check Markdown report
    expect(result.markdownReport).toContain('# Executive Competitive Battlecard & Benchmarking Report');
    expect(result.markdownReport).toContain('alpha.com');
    expect(result.markdownReport).toContain('beta.org');
    expect(result.markdownReport).toContain('Dedicated SLA');
  });

  it('should handle zero competitors gracefully', async () => {
    prismaMock.competitor.findMany.mockResolvedValue([]);

    const result = await service.generateBattlecard();

    expect(result.totalCompetitors).toBe(0);
    expect(result.mostActiveCompetitor).toBe('None');
    expect(result.lowestEntryPrice).toBe('Free');
    expect(result.competitors).toEqual([]);
    expect(result.markdownReport).toContain('# Executive Competitive Battlecard');
  });
});
