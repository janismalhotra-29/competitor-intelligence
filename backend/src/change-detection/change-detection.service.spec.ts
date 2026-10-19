import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChangeDetectionService } from './change-detection.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AiAnalysisService } from '../ai-analysis/ai-analysis.service.js';
import { NotFoundException } from '@nestjs/common';

describe('ChangeDetectionService', () => {
  let service: ChangeDetectionService;
  let prismaMock: any;
  let aiAnalysisMock: any;

  beforeEach(() => {
    prismaMock = {
      change: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      snapshot: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
    };
    aiAnalysisMock = {
      analyzeChange: vi.fn().mockResolvedValue({}),
    };
    service = new ChangeDetectionService(
      prismaMock as unknown as PrismaService,
      aiAnalysisMock as unknown as AiAnalysisService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('normalizeTextForComparison', () => {
    it('should filter out dynamic timestamps and relative time', () => {
      const raw1 = 'Welcome to our platform. Last updated 2 minutes ago on 2026-10-19 14:30:00.';
      const raw2 = 'Welcome to our platform. Last updated 15 minutes ago on 2026-10-19 14:45:00.';

      const norm1 = service.normalizeTextForComparison(raw1);
      const norm2 = service.normalizeTextForComparison(raw2);

      expect(norm1).toBe(norm2);
      expect(norm1).toContain('Welcome to our platform. Last updated on .');
    });

    it('should preserve meaningful business content changes', () => {
      const raw1 = 'Pro Plan costs $29/mo with 5 seats.';
      const raw2 = 'Pro Plan costs $49/mo with 10 seats.';

      const norm1 = service.normalizeTextForComparison(raw1);
      const norm2 = service.normalizeTextForComparison(raw2);

      expect(norm1).not.toBe(norm2);
    });
  });

  describe('getChangesByCompetitorId', () => {
    it('should return changes ordered by detectedAt desc', async () => {
      const mockChanges = [{ id: 'ch-1', competitorId: 'comp-1' }];
      prismaMock.change.findMany.mockResolvedValue(mockChanges);

      const result = await service.getChangesByCompetitorId('comp-1');
      expect(result).toEqual(mockChanges);
      expect(prismaMock.change.findMany).toHaveBeenCalledWith({
        where: { competitorId: 'comp-1' },
        orderBy: { detectedAt: 'desc' },
        include: { aiSummary: true },
      });
    });
  });

  describe('getChangeDiff', () => {
    it('should throw NotFoundException if change record not found', async () => {
      prismaMock.change.findUnique.mockResolvedValue(null);
      await expect(service.getChangeDiff('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should return diff chunks and snapshot details', async () => {
      const mockChange = {
        id: 'ch-1',
        competitorId: 'comp-1',
        oldSnapshotId: 'snap-1',
        newSnapshotId: 'snap-2',
        hasChanges: true,
        diffSummary: 'Detected 1 added block(s) and 0 removed block(s).',
        detectedAt: new Date('2026-10-13T10:00:00Z'),
        aiSummary: { analysis: 'Price updated', significance: 'HIGH' },
      };

      const mockOldSnap = {
        id: 'snap-1',
        url: 'https://example.com',
        pageTitle: 'Example Domain',
        extractedText: 'Pro Plan = $10',
        capturedAt: new Date('2026-10-12T10:00:00Z'),
      };

      const mockNewSnap = {
        id: 'snap-2',
        url: 'https://example.com',
        pageTitle: 'Example Domain - Updated',
        extractedText: 'Pro Plan = $20',
        capturedAt: new Date('2026-10-13T10:00:00Z'),
      };

      prismaMock.change.findUnique.mockResolvedValue(mockChange);
      prismaMock.snapshot.findUnique.mockImplementation(({ where }: { where: { id: string } }) => {
        if (where.id === 'snap-1') return Promise.resolve(mockOldSnap);
        if (where.id === 'snap-2') return Promise.resolve(mockNewSnap);
        return Promise.resolve(null);
      });

      const result = await service.getChangeDiff('ch-1');

      expect(result.changeId).toBe('ch-1');
      expect(result.oldSnapshot?.id).toBe('snap-1');
      expect(result.newSnapshot?.id).toBe('snap-2');
      expect(result.hasChanges).toBe(true);
      expect(result.diffChunks.length).toBeGreaterThan(0);
      expect(result.aiSummary?.significance).toBe('HIGH');
    });
  });
});
