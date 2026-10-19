import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import * as diff from 'diff';
import { AiAnalysisService } from '../ai-analysis/ai-analysis.service.js';

@Injectable()
export class ChangeDetectionService {
  private readonly logger = new Logger(ChangeDetectionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiAnalysis: AiAnalysisService,
  ) {}

  /**
   * Filters out dynamic content noise (e.g. timestamps, relative time, session tokens)
   * so that minor dynamic updates don't trigger false-positive changes or AI bills.
   */
  normalizeTextForComparison(text: string): string {
    if (!text) return '';
    return text
      // Relative time (e.g. "5 minutes ago", "1 hour ago", "3 days ago")
      .replace(/\b\d+\s+(?:seconds?|minutes?|hours?|days?|weeks?|months?|years?)\s+ago\b/gi, '')
      // Clock times (e.g. 10:45:12 AM, 14:30)
      .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\b/g, '')
      // ISO and standard date formats (e.g. 2026-10-19, Oct 19, 2026, 19/10/2026)
      .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '')
      .replace(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi, '')
      .replace(/\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g, '')
      // Hex session/CSRF tokens (32+ chars)
      .replace(/\b[a-f0-9]{32,64}\b/gi, '')
      // Whitespace collapse
      .replace(/\s+/g, ' ')
      .trim();
  }

  async detectChangesForNewSnapshot(newSnapshotId: string, competitorId: string) {
    this.logger.log(`Detecting changes for snapshot: ${newSnapshotId}`);

    const snapshots = await this.prisma.snapshot.findMany({
      where: { competitorId, status: 'SUCCESS' },
      orderBy: { capturedAt: 'desc' },
      take: 2,
    });

    if (snapshots.length < 2) {
      this.logger.log(`Only 1 snapshot found. Baseline established for competitor ${competitorId}`);
      const existingBaseline = await this.prisma.change.findFirst({
        where: { competitorId, newSnapshotId: snapshots[0].id },
      });
      if (!existingBaseline) {
        await this.prisma.change.create({
          data: {
            competitorId,
            newSnapshotId: snapshots[0].id,
            hasChanges: false,
            diffSummary: 'Initial baseline snapshot established.',
          },
        });
      }
      return;
    }

    const [latestSnapshot, previousSnapshot] = snapshots;

    if (latestSnapshot.id !== newSnapshotId) {
      this.logger.warn(`Snapshot ${newSnapshotId} is not the latest. Skipping detection.`);
      return;
    }

    const oldRawText = previousSnapshot.extractedText || '';
    const newRawText = latestSnapshot.extractedText || '';

    // Check raw equality
    if (oldRawText === newRawText) {
      this.logger.log(`No textual changes detected for competitor ${competitorId}`);
      await this.prisma.change.create({
        data: {
          competitorId,
          oldSnapshotId: previousSnapshot.id,
          newSnapshotId: latestSnapshot.id,
          hasChanges: false,
          diffSummary: 'No changes detected.',
        },
      });
      return;
    }

    // Check normalized equality to filter dynamic noise
    const normalizedOld = this.normalizeTextForComparison(oldRawText);
    const normalizedNew = this.normalizeTextForComparison(newRawText);

    if (normalizedOld === normalizedNew) {
      this.logger.log(`Dynamic content noise filtered out; no substantive change for competitor ${competitorId}`);
      await this.prisma.change.create({
        data: {
          competitorId,
          oldSnapshotId: previousSnapshot.id,
          newSnapshotId: latestSnapshot.id,
          hasChanges: false,
          diffSummary: 'No meaningful changes detected (dynamic noise filtered).',
        },
      });
      return;
    }

    // Meaningful differences exist
    const differences = diff.diffLines(oldRawText, newRawText);

    let addedCount = 0;
    let removedCount = 0;

    differences.forEach((part) => {
      if (part.added) addedCount++;
      if (part.removed) removedCount++;
    });

    const diffSummary = `Detected ${addedCount} added block(s) and ${removedCount} removed block(s).`;
    this.logger.log(`Meaningful changes detected: ${diffSummary}`);

    const change = await this.prisma.change.create({
      data: {
        competitorId,
        oldSnapshotId: previousSnapshot.id,
        newSnapshotId: latestSnapshot.id,
        hasChanges: true,
        diffSummary,
      },
    });

    // Trigger AI Analysis in the background for grounded assessment
    this.aiAnalysis.analyzeChange(change.id, oldRawText, newRawText).catch((err) => {
      this.logger.error('Background AI analysis failed', err);
    });
  }

  async getChangesByCompetitorId(competitorId: string) {
    return this.prisma.change.findMany({
      where: { competitorId },
      orderBy: { detectedAt: 'desc' },
      include: { aiSummary: true },
    });
  }

  async getChangeDiff(changeId: string) {
    const change = await this.prisma.change.findUnique({
      where: { id: changeId },
      include: { aiSummary: true },
    });

    if (!change) {
      throw new NotFoundException('Change record not found');
    }

    const newSnapshot = await this.prisma.snapshot.findUnique({
      where: { id: change.newSnapshotId },
    });

    const oldSnapshot = change.oldSnapshotId
      ? await this.prisma.snapshot.findUnique({
          where: { id: change.oldSnapshotId },
        })
      : null;

    const oldText = oldSnapshot?.extractedText || '';
    const newText = newSnapshot?.extractedText || '';

    const diffChunks = diff.diffLines(oldText, newText).map((part) => ({
      value: part.value,
      added: !!part.added,
      removed: !!part.removed,
    }));

    return {
      changeId: change.id,
      competitorId: change.competitorId,
      detectedAt: change.detectedAt,
      diffSummary: change.diffSummary,
      hasChanges: change.hasChanges,
      oldSnapshot: oldSnapshot
        ? {
            id: oldSnapshot.id,
            capturedAt: oldSnapshot.capturedAt,
            pageTitle: oldSnapshot.pageTitle,
            url: oldSnapshot.url,
          }
        : null,
      newSnapshot: newSnapshot
        ? {
            id: newSnapshot.id,
            capturedAt: newSnapshot.capturedAt,
            pageTitle: newSnapshot.pageTitle,
            url: newSnapshot.url,
          }
        : null,
      diffChunks,
      aiSummary: change.aiSummary,
    };
  }
}
