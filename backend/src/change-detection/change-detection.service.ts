import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import * as diff from 'diff';
import { AiAnalysisService } from '../ai-analysis/ai-analysis.service.js';

@Injectable()
export class ChangeDetectionService {
  private readonly logger = new Logger(ChangeDetectionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiAnalysis: AiAnalysisService
  ) {}

  async detectChangesForNewSnapshot(newSnapshotId: string, competitorId: string) {
    this.logger.log(`Detecting changes for snapshot: ${newSnapshotId}`);

    const snapshots = await this.prisma.snapshot.findMany({
      where: { competitorId, status: 'SUCCESS' },
      orderBy: { capturedAt: 'desc' },
      take: 2,
    });

    if (snapshots.length < 2) {
      this.logger.log(`Only 1 snapshot found. Baseline established for competitor ${competitorId}`);
      await this.prisma.change.create({
        data: {
          competitorId,
          newSnapshotId: snapshots[0].id,
          hasChanges: false,
          diffSummary: 'Initial baseline snapshot.',
        },
      });
      return;
    }

    const [latestSnapshot, previousSnapshot] = snapshots;
    
    if (latestSnapshot.id !== newSnapshotId) {
       this.logger.warn(`Snapshot ${newSnapshotId} is not the latest. Skipping detection.`);
       return;
    }

    const oldText = previousSnapshot.extractedText || '';
    const newText = latestSnapshot.extractedText || '';

    if (oldText === newText) {
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

    const differences = diff.diffLines(oldText, newText);
    
    let addedCount = 0;
    let removedCount = 0;

    differences.forEach((part) => {
      if (part.added) addedCount++;
      if (part.removed) removedCount++;
    });

    const diffSummary = `Detected ${addedCount} added block(s) and ${removedCount} removed block(s).`;
    this.logger.log(`Changes detected: ${diffSummary}`);

    const change = await this.prisma.change.create({
      data: {
        competitorId,
        oldSnapshotId: previousSnapshot.id,
        newSnapshotId: latestSnapshot.id,
        hasChanges: true,
        diffSummary,
      },
    });

    // Trigger AI Analysis in the background
    this.aiAnalysis.analyzeChange(change.id, oldText, newText).catch(err => {
      this.logger.error('Background AI analysis failed', err);
    });
  }
}
