import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface CompetitorBenchmarkSummary {
  id: string;
  url: string;
  domain: string;
  headline: string;
  velocity: 'HIGH' | 'MODERATE' | 'LOW';
  totalChanges: number;
  totalSnapshots: number;
  lastChecked: Date | null;
  pricingTiers: {
    name: string;
    price: string | null;
    period: string | null;
    features: string[];
  }[];
}

export interface FeatureMatrixItem {
  feature: string;
  availability: Record<string, boolean>; // domain -> boolean
}

export interface BattlecardPayload {
  generatedAt: string;
  totalCompetitors: number;
  mostActiveCompetitor: string;
  lowestEntryPrice: string;
  totalTrackedFeatures: number;
  competitors: CompetitorBenchmarkSummary[];
  featureMatrix: FeatureMatrixItem[];
  strategicSummary: string;
  markdownReport: string;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url.replace(/https?:\/\//, '').split('/')[0] || url;
  }
}

@Injectable()
export class BattlecardService {
  private readonly logger = new Logger(BattlecardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateBattlecard(): Promise<BattlecardPayload> {
    this.logger.log('Generating competitive intelligence battlecard and benchmarking matrix...');

    const competitorsData = await this.prisma.competitor.findMany({
      include: {
        snapshots: {
          orderBy: { capturedAt: 'desc' },
          take: 5,
        },
        changes: {
          orderBy: { detectedAt: 'desc' },
        },
        pricing: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const competitors: CompetitorBenchmarkSummary[] = competitorsData.map((c) => {
      const domain = extractDomain(c.url);
      const latestSnapshot = c.snapshots[0];
      const totalChanges = c.changes.length;

      let velocity: 'HIGH' | 'MODERATE' | 'LOW' = 'LOW';
      if (totalChanges >= 10) {
        velocity = 'HIGH';
      } else if (totalChanges >= 3) {
        velocity = 'MODERATE';
      }

      const pricingTiers = c.pricing.map((p) => {
        let features: string[] = [];
        if (p.features) {
          try {
            features = Array.isArray(p.features) ? p.features : JSON.parse(p.features);
          } catch {
            features = [p.features];
          }
        }
        return {
          name: p.name,
          price: p.price,
          period: p.period,
          features,
        };
      });

      return {
        id: c.id,
        url: c.url,
        domain,
        headline: latestSnapshot?.pageTitle || `${domain} Landing Page`,
        velocity,
        totalChanges,
        totalSnapshots: c.snapshots.length,
        lastChecked: latestSnapshot?.capturedAt || c.createdAt,
        pricingTiers,
      };
    });

    // 1. Compile Unique Features for Matrix
    const customFeaturesSet = new Set<string>();
    competitors.forEach((c) => {
      c.pricingTiers.forEach((p) => {
        p.features.forEach((f) => customFeaturesSet.add(f.trim()));
      });
    });

    // Standard baseline capabilities
    const baselineFeatures = [
      'Visual Snapshot Tracking',
      'Autonomous Change Detection',
      'Text & Copy Delta Logging',
    ];

    const allFeaturesList = Array.from(
      new Set([...baselineFeatures, ...Array.from(customFeaturesSet)])
    );

    const featureMatrix: FeatureMatrixItem[] = allFeaturesList.map((feature) => {
      const availability: Record<string, boolean> = {};

      competitors.forEach((c) => {
        if (baselineFeatures.includes(feature)) {
          availability[c.domain] = true;
        } else {
          // Check if competitor offers this specific feature
          const hasFeature = c.pricingTiers.some((p) =>
            p.features.some((f) => f.toLowerCase() === feature.toLowerCase())
          );
          availability[c.domain] = hasFeature;
        }
      });

      return {
        feature,
        availability,
      };
    });

    // 2. Metrics & Rankings
    const totalCompetitors = competitors.length;
    let mostActiveCompetitor = 'None';
    let highestChanges = -1;

    competitors.forEach((c) => {
      if (c.totalChanges > highestChanges) {
        highestChanges = c.totalChanges;
        mostActiveCompetitor = c.domain;
      }
    });

    let lowestEntryPrice = 'Free';
    const allPrices: number[] = [];
    competitors.forEach((c) => {
      c.pricingTiers.forEach((p) => {
        if (p.price) {
          const num = parseFloat(p.price.replace(/[^0-9.]/g, ''));
          if (!isNaN(num)) allPrices.push(num);
        }
      });
    });

    if (allPrices.length > 0) {
      const minPrice = Math.min(...allPrices);
      lowestEntryPrice = minPrice === 0 ? 'Free' : `$${minPrice}/mo`;
    }

    // 3. AI / Grounded Strategic Market Summary
    const highVelocityCount = competitors.filter((c) => c.velocity === 'HIGH').length;
    const pricedCount = competitors.filter((c) => c.pricingTiers.length > 0).length;

    const strategicSummary =
      `Market Benchmark Summary: Monitoring ${totalCompetitors} key competitors across the landscape. ` +
      `${mostActiveCompetitor} demonstrates the highest iteration velocity with ${highestChanges} detected shifts. ` +
      `${pricedCount} of ${totalCompetitors} competitors maintain transparent publicly published pricing structures, with entry rates starting at ${lowestEntryPrice}. ` +
      `Continuous visual and DOM difference tracking confirms active feature evolution across ${featureMatrix.length} evaluated capabilities.`;

    // 4. Generate Comprehensive Markdown Report
    const markdownReport = this.buildMarkdownBattlecard({
      generatedAt: new Date().toISOString(),
      totalCompetitors,
      mostActiveCompetitor,
      lowestEntryPrice,
      totalTrackedFeatures: featureMatrix.length,
      competitors,
      featureMatrix,
      strategicSummary,
    });

    return {
      generatedAt: new Date().toISOString(),
      totalCompetitors,
      mostActiveCompetitor,
      lowestEntryPrice,
      totalTrackedFeatures: featureMatrix.length,
      competitors,
      featureMatrix,
      strategicSummary,
      markdownReport,
    };
  }

  private buildMarkdownBattlecard(data: Omit<BattlecardPayload, 'markdownReport'>): string {
    const domains = data.competitors.map((c) => c.domain);

    let matrixHeader = `| Feature Capability | ${domains.join(' | ')} |\n`;
    matrixHeader += `| :--- | ${domains.map(() => ':---:').join(' | ')} |\n`;

    let matrixRows = '';
    data.featureMatrix.forEach((item) => {
      const checks = domains
        .map((d) => (item.availability[d] ? '✅ Yes' : '—'))
        .join(' | ');
      matrixRows += `| **${item.feature}** | ${checks} |\n`;
    });

    let compRows = '';
    data.competitors.forEach((c) => {
      const pricingStr =
        c.pricingTiers.length > 0
          ? c.pricingTiers.map((p) => `${p.name} (${p.price || 'Free'})`).join(', ')
          : 'Standard / Not Listed';
      compRows += `| [${c.domain}](${c.url}) | **${c.velocity}** | ${c.totalChanges} | ${c.totalSnapshots} | ${pricingStr} |\n`;
    });

    return `# Executive Competitive Battlecard & Benchmarking Report
*Generated on: ${new Date(data.generatedAt).toLocaleString()}*

---

## 1. Executive Market Summary
> ${data.strategicSummary}

---

## 2. Competitive Landscape & Velocity Index
| Competitor Domain | Activity Velocity | Updates Detected | Viewport Snapshots | Pricing Model |
| :--- | :---: | :---: | :---: | :--- |
${compRows}
---

## 3. Cross-Competitor Capability & Feature Matrix
${matrixHeader}${matrixRows}
---

## 4. Key Takeaways & Recommendations
- **Velocity Leader:** **${data.mostActiveCompetitor}** is iterating rapidly. Review visual snapshots and changelogs frequently to identify emerging product directions.
- **Pricing Landscape:** Entry pricing anchors around **${data.lowestEntryPrice}**. Position value propositions against tiered capability offerings.
- **Continuous Intelligence:** Automated crawlers will monitor DOM shifts, headline revisions, and pricing deltas autonomously.
`;
  }
}
