'use client';

import React from 'react';
import {
  Surface,
  Group,
  Stack,
  Text,
  Badge,
  Button,
  Icon,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@xenon-kit/web';
import { CurrencyDollar, FileText } from '@phosphor-icons/react';
import type { Competitor, PricingPlan } from '@/types';

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url.replace(/https?:\/\//, '').split('/')[0];
  }
}

interface PricingMatrixProps {
  competitors: Competitor[];
  pricingMap: Record<string, PricingPlan[]>;
  onDownloadReport: (competitorId: string, url: string) => void;
}

export function PricingMatrix({
  competitors,
  pricingMap,
  onDownloadReport,
}: PricingMatrixProps) {
  // Flatten all pricing plans
  const allPlans: Array<{ competitor: Competitor; plan: PricingPlan }> = [];

  for (const comp of competitors) {
    const plans = pricingMap[comp.id] || [];
    for (const p of plans) {
      allPlans.push({ competitor: comp, plan: p });
    }
  }

  return (
    <Surface
      variant="default"
      padding={0}
      style={{
        borderRadius: 'var(--x-radius)',
        border: '1px solid var(--x-border)',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--x-border)' }}>
        <Group justify="space-between" align="center">
          <div>
            <Text styleKey="headline" weight={300}>
              Pricing Comparison Matrix
            </Text>
            <Text styleKey="caption1" weight={300} style={{ color: 'var(--x-text-muted)', marginTop: '2px' }}>
              Compare subscription plans, pricing tiers, and included features across competitors
            </Text>
          </div>
          <Badge variant="subtle" tone="accent">
            {allPlans.length} Tiers Tracked
          </Badge>
        </Group>
      </div>

      {allPlans.length === 0 ? (
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <Stack gap={12} align="center">
            <Icon size="lg" style={{ color: 'var(--x-text-muted)' }}>
              <CurrencyDollar weight="thin" />
            </Icon>
            <Text styleKey="callout" weight={300} style={{ color: 'var(--x-text-muted)' }}>
              No pricing plans extracted yet. Click &quot;Check Updates&quot; on any competitor to detect their pricing tiers.
            </Text>
          </Stack>
        </div>
      ) : (
        <Table variant="default" size="md">
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: '22%' }}>COMPETITOR</TableHead>
              <TableHead style={{ width: '18%' }}>TIER</TableHead>
              <TableHead style={{ width: '18%' }}>PRICE</TableHead>
              <TableHead style={{ width: '28%' }}>KEY FEATURES</TableHead>
              <TableHead style={{ width: '14%', textAlign: 'right' }}>REPORT</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allPlans.map(({ competitor, plan }, index) => {
              const features: string[] = Array.isArray(plan.features)
                ? plan.features
                : typeof plan.features === 'string'
                ? JSON.parse(plan.features || '[]')
                : [];

              const domain = extractDomain(competitor.url);

              return (
                <TableRow key={plan.id || index}>
                  <TableCell>
                    <Group gap={8} align="center">
                      <Text styleKey="callout" weight={400} style={{ color: 'var(--x-text)' }}>
                        {domain}
                      </Text>
                    </Group>
                  </TableCell>
                  <TableCell>
                    <Badge variant="subtle" tone="accent" size="sm">
                      {plan.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Group gap={4} align="baseline">
                      <Text styleKey="headline" weight={300} style={{ color: 'var(--x-text)' }}>
                        {plan.price ? `$${plan.price}` : 'Free / Contact'}
                      </Text>
                      {plan.period && (
                        <Text styleKey="caption2" weight={300} style={{ color: 'var(--x-text-muted)' }}>
                          / {plan.period}
                        </Text>
                      )}
                    </Group>
                  </TableCell>
                  <TableCell>
                    <Group gap={6} wrap="wrap">
                      {features.slice(0, 3).map((feat, fIdx) => (
                        <Badge key={fIdx} variant="outline" tone="neutral" size="sm">
                          {feat}
                        </Badge>
                      ))}
                      {features.length > 3 && (
                        <Text styleKey="caption2" weight={300} style={{ color: 'var(--x-text-muted)' }}>
                          +{features.length - 3} more
                        </Text>
                      )}
                      {features.length === 0 && (
                        <Text styleKey="caption2" weight={300} style={{ color: 'var(--x-text-muted)' }}>
                          Standard tier capabilities
                        </Text>
                      )}
                    </Group>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDownloadReport(competitor.id, competitor.url)}
                    >
                      <Icon size="sm">
                        <FileText weight="thin" />
                      </Icon>
                      Export
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Surface>
  );
}
