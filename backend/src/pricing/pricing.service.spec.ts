import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PricingService } from './pricing.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotFoundException } from '@nestjs/common';

describe('PricingService', () => {
  let service: PricingService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      competitor: {
        findUnique: vi.fn(),
      },
      pricingPlan: {
        findMany: vi.fn(),
        deleteMany: vi.fn(),
        create: vi.fn(),
      },
    };
    service = new PricingService(prismaMock as unknown as PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPricingByCompetitor', () => {
    it('should throw NotFoundException if competitor not found', async () => {
      prismaMock.competitor.findUnique.mockResolvedValue(null);
      await expect(service.getPricingByCompetitor('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should return pricing plans for existing competitor', async () => {
      prismaMock.competitor.findUnique.mockResolvedValue({ id: 'comp-1' });
      prismaMock.pricingPlan.findMany.mockResolvedValue([
        { id: 'plan-1', name: 'Pro', price: '$29' },
      ]);

      const result = await service.getPricingByCompetitor('comp-1');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Pro');
    });
  });

  describe('generateExecutiveReport', () => {
    it('should throw NotFoundException if competitor not found', async () => {
      prismaMock.competitor.findUnique.mockResolvedValue(null);
      await expect(service.generateExecutiveReport('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should generate markdown report with competitor details and pricing', async () => {
      const mockCompetitor = {
        id: 'comp-1',
        url: 'https://example.com',
        createdAt: new Date('2026-10-01'),
        snapshots: [
          { pageTitle: 'Example', capturedAt: new Date(), status: 'SUCCESS' },
        ],
        changes: [
          { hasChanges: true, diffSummary: 'Price change', detectedAt: new Date(), aiSummary: { significance: 'HIGH', analysis: 'Pro plan increased' } },
        ],
        pricing: [
          { name: 'Pro', price: '$29', period: 'monthly', features: '["Feature A"]' },
        ],
        alerts: [],
      };

      prismaMock.competitor.findUnique.mockResolvedValue(mockCompetitor);

      const result = await service.generateExecutiveReport('comp-1');
      expect(result.competitorId).toBe('comp-1');
      expect(result.reportMarkdown).toContain('Competitor Intelligence Executive Report');
      expect(result.reportMarkdown).toContain('https://example.com');
      expect(result.reportMarkdown).toContain('Pro');
      expect(result.reportMarkdown).toContain('$29');
    });
  });

  describe('extractPricingFromText', () => {
    it('should return empty array for empty text', async () => {
      const result = await service.extractPricingFromText('comp-1', 'snap-1', '');
      expect(result).toEqual([]);
    });

    it('should extract heuristic plans when pricing keywords are present without OpenAI key', async () => {
      prismaMock.competitor.findUnique.mockResolvedValue({ id: 'comp-1' });
      prismaMock.pricingPlan.findMany.mockResolvedValue([
        { id: 'plan-1', name: 'Starter', price: '$0' },
      ]);

      const result = await service.extractPricingFromText(
        'comp-1',
        'snap-1',
        'Our new plan is $29/mo with great pricing options',
      );

      expect(prismaMock.pricingPlan.deleteMany).toHaveBeenCalled();
      expect(prismaMock.pricingPlan.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});
