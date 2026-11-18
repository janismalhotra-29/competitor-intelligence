'use client';

import React, { useState, useEffect } from 'react';
import type { BattlecardPayload } from '@/types';
import { fetchBattlecard } from '@/lib/api';
import {
  Surface,
  Group,
  Stack,
  Heading,
  Text,
  Badge,
  Button,
  Icon,
  Divider,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Avatar,
  Spinner,
  toast,
} from '@xenon-kit/web';
import {
  Lightning,
  Check,
  Minus,
  DownloadSimple,
  ArrowClockwise,
  Sparkle,
  TrendUp,
  ShieldCheck,
  ArrowSquareOut,
} from '@phosphor-icons/react';

export function CompetitiveBattlecard() {
  const [data, setData] = useState<BattlecardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let active = true;
    fetchBattlecard()
      .then((payload) => {
        if (active) {
          setData(payload);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          toast.error('Failed to load battlecard', {
            description: 'Ensure the backend server is running on port 3001.',
          });
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const payload = await fetchBattlecard();
      setData(payload);
      toast.success('Battlecard Updated', {
        description: 'Refreshed competitive benchmark and capability matrix.',
      });
    } catch {
      toast.error('Failed to load battlecard', {
        description: 'Ensure the backend server is running on port 3001.',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleDownload = () => {
    if (!data) return;
    const blob = new Blob([data.markdownReport], { type: 'text/markdown;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `competitive_battlecard_${dateStr}.md`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('Battlecard Exported', {
      description: 'Downloaded complete executive competitive intelligence report.',
    });
  };

  if (loading) {
    return (
      <Surface
        variant="default"
        padding={48}
        style={{
          borderRadius: 'var(--x-radius)',
          border: '1px solid var(--x-border)',
          textAlign: 'center',
        }}
      >
        <Group justify="center" gap={12} align="center">
          <Spinner size="md" />
          <Text styleKey="callout" weight={300} style={{ color: 'var(--x-text-muted)' }}>
            Synthesizing competitive intelligence and feature matrix...
          </Text>
        </Group>
      </Surface>
    );
  }

  if (!data || data.competitors.length === 0) {
    return (
      <Surface
        variant="default"
        padding={48}
        style={{
          borderRadius: 'var(--x-radius)',
          border: '1px solid var(--x-border)',
          textAlign: 'center',
        }}
      >
        <Stack gap={12} align="center">
          <Icon size="lg" style={{ color: 'var(--x-text-muted)' }}>
            <Lightning weight="thin" />
          </Icon>
          <Text styleKey="headline" weight={300}>
            No Competitor Data for Benchmarking
          </Text>
          <Text styleKey="callout" weight={300} style={{ color: 'var(--x-text-muted)', maxWidth: '440px' }}>
            Add at least one competitor website from the Websites tab to generate an automated executive battlecard and capability matrix.
          </Text>
        </Stack>
      </Surface>
    );
  }

  return (
    <Stack gap={24}>
      {/* 1. Header Card with Title & Export Actions */}
      <Surface
        variant="default"
        padding={24}
        style={{
          borderRadius: 'var(--x-radius)',
          border: '1px solid var(--x-border)',
          backgroundColor: 'var(--x-surface-1)',
        }}
      >
        <Group justify="space-between" align="center" wrap="wrap" gap={16}>
          <div>
            <Group gap={8} align="center">
              <Icon size="sm" style={{ color: 'var(--x-accent)' }}>
                <Lightning weight="thin" />
              </Icon>
              <Heading level={2} styleKey="title3" weight={300}>
                AI Competitive Battlecard & Benchmark
              </Heading>
              <Badge variant="subtle" tone="accent" size="sm">
                Executive Synthesis
              </Badge>
            </Group>
            <Text styleKey="callout" weight={300} style={{ color: 'var(--x-text-muted)', marginTop: '4px' }}>
              Side-by-side positioning analysis, cross-competitor capability matrix, and pricing benchmark.
            </Text>
          </div>

          <Group gap={8} align="center">
            <Button
              variant="accent"
              size="sm"
              onClick={handleDownload}
            >
              <Icon size="sm">
                <DownloadSimple weight="thin" />
              </Icon>
              <span>Export Battlecard (.md)</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              disabled={refreshing}
              onClick={handleRefresh}
            >
              {refreshing ? (
                <Spinner size="sm" />
              ) : (
                <Icon size="sm">
                  <ArrowClockwise weight="thin" />
                </Icon>
              )}
              <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
            </Button>
          </Group>
        </Group>
      </Surface>

      {/* 2. Key KPI Benchmark Ribbon */}
      <Surface
        variant="default"
        padding={0}
        style={{
          borderRadius: 'var(--x-radius)',
          border: '1px solid var(--x-border)',
          overflow: 'hidden',
          backgroundColor: 'var(--x-surface-1)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            alignItems: 'center',
          }}
        >
          {/* KPI 1: Monitored Competitors */}
          <div style={{ padding: '16px 20px' }}>
            <Text styleKey="caption2" weight={400} style={{ color: 'var(--x-text-muted)', letterSpacing: '0.04em' }}>
              COMPETITORS BENCHMARKED
            </Text>
            <Group align="center" gap={8} style={{ marginTop: '4px' }}>
              <Text styleKey="title2" weight={400}>
                {data.totalCompetitors}
              </Text>
              <Badge variant="subtle" tone="accent" size="sm">
                Live
              </Badge>
            </Group>
          </div>

          <Divider orientation="vertical" />

          {/* KPI 2: Velocity Leader */}
          <div style={{ padding: '16px 20px' }}>
            <Text styleKey="caption2" weight={400} style={{ color: 'var(--x-text-muted)', letterSpacing: '0.04em' }}>
              VELOCITY LEADER
            </Text>
            <Group align="center" gap={8} style={{ marginTop: '4px' }}>
              <Text styleKey="callout" weight={400} style={{ color: 'var(--x-text)' }}>
                {data.mostActiveCompetitor}
              </Text>
              <Badge variant="outline" tone="accent" size="sm">
                <Icon size="xs">
                  <TrendUp weight="thin" />
                </Icon>
                <span>Active</span>
              </Badge>
            </Group>
          </div>

          <Divider orientation="vertical" />

          {/* KPI 3: Lowest Entry Price */}
          <div style={{ padding: '16px 20px' }}>
            <Text styleKey="caption2" weight={400} style={{ color: 'var(--x-text-muted)', letterSpacing: '0.04em' }}>
              MARKET ENTRY PRICE
            </Text>
            <Group align="center" gap={8} style={{ marginTop: '4px' }}>
              <Text styleKey="title2" weight={400}>
                {data.lowestEntryPrice}
              </Text>
              <Badge variant="outline" tone="neutral" size="sm">
                Floor
              </Badge>
            </Group>
          </div>

          <Divider orientation="vertical" />

          {/* KPI 4: Capabilities Evaluated */}
          <div style={{ padding: '16px 20px' }}>
            <Text styleKey="caption2" weight={400} style={{ color: 'var(--x-text-muted)', letterSpacing: '0.04em' }}>
              EVALUATED CAPABILITIES
            </Text>
            <Group align="center" gap={8} style={{ marginTop: '4px' }}>
              <Text styleKey="title2" weight={400}>
                {data.totalTrackedFeatures}
              </Text>
              <Badge variant="subtle" tone="accent" size="sm">
                Matrix
              </Badge>
            </Group>
          </div>
        </div>
      </Surface>

      {/* 3. AI Strategic Summary Highlight */}
      <Surface
        variant="default"
        padding={20}
        style={{
          borderRadius: 'var(--x-radius)',
          border: '1px solid var(--x-border)',
          backgroundColor: 'var(--x-surface-1)',
        }}
      >
        <Group gap={12} align="flex-start">
          <Icon size="sm" style={{ color: 'var(--x-accent)', marginTop: '2px', flexShrink: 0 }}>
            <Sparkle weight="thin" />
          </Icon>
          <div style={{ flex: 1 }}>
            <Text styleKey="callout" weight={400} style={{ color: 'var(--x-text)', marginBottom: '4px' }}>
              Executive Strategic Briefing
            </Text>
            <Text styleKey="callout" weight={300} style={{ color: 'var(--x-text)', lineHeight: 1.6 }}>
              {data.strategicSummary}
            </Text>
          </div>
        </Group>
      </Surface>

      {/* 4. Competitor Positioning Cards */}
      <div>
        <Text styleKey="caption1" weight={400} style={{ color: 'var(--x-text-muted)', marginBottom: '12px', letterSpacing: '0.04em' }}>
          COMPETITOR POSITIONING & VELOCITY
        </Text>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
          }}
        >
          {data.competitors.map((c) => {
            const initials =
              c.domain
                .replace(/[^a-zA-Z0-9]/g, '')
                .slice(0, 2)
                .toUpperCase() || 'CO';

            return (
              <Surface
                key={c.id}
                variant="default"
                padding={20}
                style={{
                  borderRadius: 'var(--x-radius)',
                  border: '1px solid var(--x-border)',
                }}
              >
                <Stack gap={12}>
                  <Group justify="space-between" align="center">
                    <Group gap={10} align="center">
                      <Avatar fallback={initials} size="sm" />
                      <div>
                        <Text styleKey="callout" weight={400}>
                          {c.domain}
                        </Text>
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: 'var(--x-text-muted)',
                            fontSize: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            textDecoration: 'none',
                          }}
                        >
                          <span>Visit site</span>
                          <Icon size="xs">
                            <ArrowSquareOut weight="thin" />
                          </Icon>
                        </a>
                      </div>
                    </Group>
                    <Badge
                      variant="subtle"
                      tone={c.velocity === 'HIGH' ? 'accent' : c.velocity === 'MODERATE' ? 'neutral' : 'neutral'}
                      size="sm"
                    >
                      {c.velocity} Velocity
                    </Badge>
                  </Group>

                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--x-radius-sm)',
                      backgroundColor: 'var(--x-surface-1)',
                      border: '1px solid var(--x-border)',
                    }}
                  >
                    <Text styleKey="caption2" weight={300} style={{ color: 'var(--x-text-muted)' }}>
                      Headline / Title:
                    </Text>
                    <Text styleKey="caption1" weight={400} style={{ color: 'var(--x-text)', marginTop: '2px' }}>
                      {c.headline}
                    </Text>
                  </div>

                  <Group justify="space-between" align="center">
                    <Text styleKey="caption2" weight={300} style={{ color: 'var(--x-text-muted)' }}>
                      Updates: <strong style={{ color: 'var(--x-text)', fontWeight: 400 }}>{c.totalChanges}</strong>
                    </Text>
                    <Text styleKey="caption2" weight={300} style={{ color: 'var(--x-text-muted)' }}>
                      Pricing:{' '}
                      <strong style={{ color: 'var(--x-text)', fontWeight: 400 }}>
                        {c.pricingTiers.length > 0 ? `${c.pricingTiers.length} Tiers` : 'Unlisted'}
                      </strong>
                    </Text>
                  </Group>
                </Stack>
              </Surface>
            );
          })}
        </div>
      </div>

      {/* 5. Cross-Competitor Capability & Feature Matrix */}
      <Surface
        variant="default"
        padding={0}
        style={{
          borderRadius: 'var(--x-radius)',
          border: '1px solid var(--x-border)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--x-border)' }}>
          <Group justify="space-between" align="center">
            <div>
              <Text styleKey="callout" weight={400}>
                Cross-Competitor Capability Matrix
              </Text>
              <Text styleKey="caption2" weight={300} style={{ color: 'var(--x-text-muted)', marginTop: '2px' }}>
                Feature coverage across all monitored domains
              </Text>
            </div>
            <Badge variant="subtle" tone="accent" size="sm">
              {data.featureMatrix.length} Capabilities Evaluated
            </Badge>
          </Group>
        </div>

        <Table variant="default" size="sm">
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: '35%' }}>CAPABILITY / FEATURE</TableHead>
              {data.competitors.map((c) => (
                <TableHead key={c.id} style={{ textAlign: 'center' }}>
                  {c.domain}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.featureMatrix.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <Group gap={8} align="center">
                    <Icon size="xs" style={{ color: 'var(--x-accent)' }}>
                      <ShieldCheck weight="thin" />
                    </Icon>
                    <Text styleKey="caption1" weight={400}>
                      {row.feature}
                    </Text>
                  </Group>
                </TableCell>
                {data.competitors.map((c) => {
                  const hasCapability = !!row.availability[c.domain];
                  return (
                    <TableCell key={c.id} style={{ textAlign: 'center' }}>
                      {hasCapability ? (
                        <Badge variant="subtle" tone="accent" size="sm">
                          <Icon size="xs">
                            <Check weight="bold" />
                          </Icon>
                          <span>Yes</span>
                        </Badge>
                      ) : (
                        <Text styleKey="caption2" weight={300} style={{ color: 'var(--x-text-muted)' }}>
                          <Icon size="xs">
                            <Minus weight="thin" />
                          </Icon>
                        </Text>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Surface>
    </Stack>
  );
}
