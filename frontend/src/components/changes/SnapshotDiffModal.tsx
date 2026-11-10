'use client';

import React, { useEffect, useState } from 'react';
import type { ChangeDiffResult } from '@/types';
import { API_URL } from '@/lib/api';
import {
  Stack,
  Group,
  Heading,
  Text,
  Badge,
  Button,
  IconButton,
  Icon,
  Divider,
  Alert,
  Spinner,
} from '@xenon-kit/web';
import {
  X,
  FileText,
  Camera,
  Columns,
  Sliders,
  Flame,
  Sparkle,
  Lightning,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react';

interface Props {
  diffData: ChangeDiffResult | null;
  loading: boolean;
  onClose: () => void;
}

export function SnapshotDiffModal({ diffData, loading, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'text' | 'visual'>('text');
  const [visualMode, setVisualMode] = useState<'side-by-side' | 'slider' | 'heatmap'>('side-by-side');
  const [sliderPosition, setSliderPosition] = useState<number>(50);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!diffData && !loading) return null;

  const hasAnyScreenshot =
    Boolean(diffData?.oldSnapshot?.screenshotUrl) || Boolean(diffData?.newSnapshot?.screenshotUrl);
  const hasVisualDiff = Boolean(diffData?.visualDiff?.diffImageUrl);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--x-space-6)',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1020px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--x-surface)',
          border: '1px solid var(--x-border)',
          borderRadius: 'var(--x-radius)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: 'var(--x-space-4) var(--x-space-6)',
            borderBottom: '1px solid var(--x-border)',
            backgroundColor: 'var(--x-surface-2)',
          }}
        >
          <Group justify="between" align="center">
            <Stack gap={4}>
              <Group gap={8} align="center">
                <Heading level={2} styleKey="title3" weight={300}>
                  Snapshot Diff Inspector
                </Heading>
                {diffData?.aiSummary && (
                  <Badge
                    variant="subtle"
                    tone={
                      diffData.aiSummary.significance === 'HIGH'
                        ? 'danger'
                        : diffData.aiSummary.significance === 'MEDIUM'
                        ? 'warning'
                        : 'accent'
                    }
                  >
                    <Icon size="xs">
                      <Sparkle weight="thin" />
                    </Icon>
                    {diffData.aiSummary.significance} IMPACT
                  </Badge>
                )}
                {diffData?.visualDiff && (
                  <Badge variant="subtle" tone="accent">
                    <Icon size="xs">
                      <Lightning weight="thin" />
                    </Icon>
                    {diffData.visualDiff.diffPercentage}% VISUAL DIFF
                  </Badge>
                )}
              </Group>
              <Text styleKey="footnote" tone="muted" weight={300}>
                Comparing snapshots captured around{' '}
                {diffData ? new Date(diffData.detectedAt).toLocaleString() : ''}
              </Text>
            </Stack>

            <IconButton ariaLabel="Close dialog" variant="ghost" onClick={onClose}>
              <Icon size="sm">
                <X weight="thin" />
              </Icon>
            </IconButton>
          </Group>
        </div>

        {/* Tab Selection Row */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--x-border)',
            backgroundColor: 'var(--x-surface)',
            padding: '0 var(--x-space-6)',
            gap: 'var(--x-space-2)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--x-space-2)',
              padding: 'var(--x-space-3) var(--x-space-4)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'text' ? '1px solid var(--x-accent)' : '1px solid transparent',
              color: activeTab === 'text' ? 'var(--x-accent)' : 'var(--x-text-muted)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '13px',
              fontWeight: 300,
              transition: 'color var(--x-dur-base) var(--x-ease-standard)',
            }}
          >
            <Icon size="sm">
              <FileText weight="thin" />
            </Icon>
            <span>Text Differences</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('visual')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--x-space-2)',
              padding: 'var(--x-space-3) var(--x-space-4)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'visual' ? '1px solid var(--x-accent)' : '1px solid transparent',
              color: activeTab === 'visual' ? 'var(--x-accent)' : 'var(--x-text-muted)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '13px',
              fontWeight: 300,
              transition: 'color var(--x-dur-base) var(--x-ease-standard)',
            }}
          >
            <Icon size="sm">
              <Camera weight="thin" />
            </Icon>
            <span>Visual Screenshots & Slider</span>
            {hasAnyScreenshot && (
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--x-accent)',
                  display: 'inline-block',
                }}
              />
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'var(--x-space-6)',
          }}
        >
          {loading ? (
            <div
              style={{
                padding: 'var(--x-space-10) 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--x-space-3)',
                color: 'var(--x-text-muted)',
              }}
            >
              <Spinner size="md" />
              <Text styleKey="callout" tone="muted" weight={300}>
                Calculating snapshot differences...
              </Text>
            </div>
          ) : diffData ? (
            <Stack gap={20}>
              {/* AI Insight Alert */}
              {diffData.aiSummary && (
                <Alert tone="accent" variant="subtle" title="AI Business Summary">
                  <Text styleKey="callout" weight={300}>
                    {diffData.aiSummary.analysis}
                  </Text>
                </Alert>
              )}

              {/* Snapshot Metadata Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 'var(--x-space-3)',
                }}
              >
                <div
                  style={{
                    padding: 'var(--x-space-3) var(--x-space-4)',
                    borderRadius: 'var(--x-radius)',
                    backgroundColor: 'var(--x-surface-2)',
                    border: '1px solid var(--x-border)',
                  }}
                >
                  <Text styleKey="caption1" tone="muted" weight={300}>
                    PREVIOUS SNAPSHOT (BASELINE)
                  </Text>
                  <div style={{ marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <Text styleKey="body" weight={300}>
                      {diffData.oldSnapshot?.pageTitle || 'Initial State'}
                    </Text>
                  </div>
                  <Text styleKey="footnote" tone="muted" weight={300}>
                    {diffData.oldSnapshot
                      ? new Date(diffData.oldSnapshot.capturedAt).toLocaleString()
                      : 'No previous baseline'}
                  </Text>
                </div>

                <div
                  style={{
                    padding: 'var(--x-space-3) var(--x-space-4)',
                    borderRadius: 'var(--x-radius)',
                    backgroundColor: 'var(--x-surface-2)',
                    border: '1px solid var(--x-border)',
                  }}
                >
                  <Text styleKey="caption1" tone="muted" weight={300}>
                    CURRENT SNAPSHOT (UPDATED)
                  </Text>
                  <div style={{ marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <Text styleKey="body" weight={300}>
                      {diffData.newSnapshot?.pageTitle || 'Current State'}
                    </Text>
                  </div>
                  <Text styleKey="footnote" tone="muted" weight={300}>
                    {diffData.newSnapshot
                      ? new Date(diffData.newSnapshot.capturedAt).toLocaleString()
                      : 'Current'}
                  </Text>
                </div>
              </div>

              {/* TAB 1: Text Differences */}
              {activeTab === 'text' && (
                <Stack gap={10}>
                  <Group justify="between" align="center">
                    <Heading level={3} styleKey="headline" weight={300}>
                      Line-by-Line Content Differences
                    </Heading>
                    <Text styleKey="footnote" tone="muted" weight={300}>
                      {diffData.diffSummary || 'Content comparison'}
                    </Text>
                  </Group>

                  <div
                    style={{
                      borderRadius: 'var(--x-radius)',
                      border: '1px solid var(--x-border)',
                      backgroundColor: 'var(--x-surface-2)',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      overflowX: 'auto',
                      maxHeight: '380px',
                      padding: 'var(--x-space-3)',
                      userSelect: 'text',
                    }}
                  >
                    {diffData.diffChunks.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 'var(--x-space-6)', color: 'var(--x-text-muted)' }}>
                        <Text styleKey="footnote" tone="muted" weight={300}>
                          No substantive text differences detected.
                        </Text>
                      </div>
                    ) : (
                      diffData.diffChunks.map((chunk, index) => {
                        if (chunk.added) {
                          return (
                            <div
                              key={index}
                              style={{
                                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                color: '#4ade80',
                                padding: '2px 8px',
                                borderLeft: '2px solid #22c55e',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                              }}
                            >
                              <span style={{ color: '#16a34a', userSelect: 'none', marginRight: '8px' }}>+</span>
                              {chunk.value}
                            </div>
                          );
                        }
                        if (chunk.removed) {
                          return (
                            <div
                              key={index}
                              style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                color: '#f87171',
                                padding: '2px 8px',
                                borderLeft: '2px solid #ef4444',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                              }}
                            >
                              <span style={{ color: '#dc2626', userSelect: 'none', marginRight: '8px' }}>-</span>
                              {chunk.value}
                            </div>
                          );
                        }
                        return (
                          <div
                            key={index}
                            style={{
                              color: 'var(--x-text-muted)',
                              padding: '2px 8px',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                            }}
                          >
                            <span style={{ color: 'var(--x-border)', userSelect: 'none', marginRight: '8px' }}> </span>
                            {chunk.value}
                          </div>
                        );
                      })
                    )}
                  </div>
                </Stack>
              )}

              {/* TAB 2: Visual Comparison */}
              {activeTab === 'visual' && (
                <Stack gap={16}>
                  {/* Mode Selector Row */}
                  <Group justify="between" align="center" wrap="wrap" gap={12}>
                    <Group gap={6}>
                      <Button
                        size="sm"
                        variant={visualMode === 'side-by-side' ? 'accent' : 'subtle'}
                        onClick={() => setVisualMode('side-by-side')}
                      >
                        <Icon size="xs">
                          <Columns weight="thin" />
                        </Icon>
                        Side-by-Side
                      </Button>
                      <Button
                        size="sm"
                        variant={visualMode === 'slider' ? 'accent' : 'subtle'}
                        onClick={() => setVisualMode('slider')}
                      >
                        <Icon size="xs">
                          <Sliders weight="thin" />
                        </Icon>
                        Split Curtain Slider
                      </Button>
                      <Button
                        size="sm"
                        variant={visualMode === 'heatmap' ? 'accent' : 'subtle'}
                        onClick={() => setVisualMode('heatmap')}
                      >
                        <Icon size="xs">
                          <Flame weight="thin" />
                        </Icon>
                        Diff Heatmap
                      </Button>
                    </Group>

                    {diffData.visualDiff && (
                      <Group gap={8} align="center">
                        <Text styleKey="footnote" weight={300}>
                          {diffData.visualDiff.diffPercentage}% Changed Area
                        </Text>
                        <Text styleKey="footnote" tone="muted" weight={300}>
                          •
                        </Text>
                        <Text styleKey="footnote" tone="muted" weight={300}>
                          {diffData.visualDiff.diffPixels.toLocaleString()} altered px
                        </Text>
                        <Text styleKey="footnote" tone="muted" weight={300}>
                          •
                        </Text>
                        <Text styleKey="footnote" tone="muted" weight={300}>
                          {diffData.visualDiff.width}×{diffData.visualDiff.height}
                        </Text>
                      </Group>
                    )}
                  </Group>

                  {/* MODE 1: Side-by-Side View */}
                  {visualMode === 'side-by-side' && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: 'var(--x-space-4)',
                      }}
                    >
                      {/* Baseline Screenshot */}
                      <div
                        style={{
                          borderRadius: 'var(--x-radius)',
                          border: '1px solid var(--x-border)',
                          padding: 'var(--x-space-3)',
                          backgroundColor: 'var(--x-surface-2)',
                        }}
                      >
                        <Group justify="between" align="center" style={{ marginBottom: '8px' }}>
                          <Group gap={6} align="center">
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--x-accent)',
                              }}
                            />
                            <Text styleKey="callout" weight={300}>
                              Baseline (Before)
                            </Text>
                          </Group>
                          <Text styleKey="caption1" tone="muted" weight={300}>
                            {diffData.oldSnapshot
                              ? new Date(diffData.oldSnapshot.capturedAt).toLocaleTimeString()
                              : 'N/A'}
                          </Text>
                        </Group>

                        {diffData.oldSnapshot?.screenshotUrl ? (
                          <div
                            style={{
                              borderRadius: 'calc(var(--x-radius) - 2px)',
                              overflow: 'hidden',
                              border: '1px solid var(--x-border)',
                              backgroundColor: 'var(--x-bg)',
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`${API_URL}${diffData.oldSnapshot.screenshotUrl}`}
                              alt="Baseline Screenshot"
                              style={{ width: '100%', height: 'auto', maxHeight: '380px', objectFit: 'contain', display: 'block' }}
                            />
                          </div>
                        ) : (
                          <div
                            style={{
                              height: '240px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 'var(--x-radius)',
                              border: '1px dashed var(--x-border)',
                              color: 'var(--x-text-muted)',
                            }}
                          >
                            <Icon size="md">
                              <Camera weight="thin" />
                            </Icon>
                            <Text styleKey="footnote" tone="muted" weight={300}>
                              No baseline visual capture
                            </Text>
                          </div>
                        )}
                      </div>

                      {/* Current Screenshot */}
                      <div
                        style={{
                          borderRadius: 'var(--x-radius)',
                          border: '1px solid var(--x-border)',
                          padding: 'var(--x-space-3)',
                          backgroundColor: 'var(--x-surface-2)',
                        }}
                      >
                        <Group justify="between" align="center" style={{ marginBottom: '8px' }}>
                          <Group gap={6} align="center">
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--x-accent)',
                              }}
                            />
                            <Text styleKey="callout" weight={300}>
                              Current (After)
                            </Text>
                          </Group>
                          <Text styleKey="caption1" tone="muted" weight={300}>
                            {diffData.newSnapshot
                              ? new Date(diffData.newSnapshot.capturedAt).toLocaleTimeString()
                              : 'N/A'}
                          </Text>
                        </Group>

                        {diffData.newSnapshot?.screenshotUrl ? (
                          <div
                            style={{
                              borderRadius: 'calc(var(--x-radius) - 2px)',
                              overflow: 'hidden',
                              border: '1px solid var(--x-border)',
                              backgroundColor: 'var(--x-bg)',
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`${API_URL}${diffData.newSnapshot.screenshotUrl}`}
                              alt="Current Screenshot"
                              style={{ width: '100%', height: 'auto', maxHeight: '380px', objectFit: 'contain', display: 'block' }}
                            />
                          </div>
                        ) : (
                          <div
                            style={{
                              height: '240px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 'var(--x-radius)',
                              border: '1px dashed var(--x-border)',
                              color: 'var(--x-text-muted)',
                            }}
                          >
                            <Icon size="md">
                              <Camera weight="thin" />
                            </Icon>
                            <Text styleKey="footnote" tone="muted" weight={300}>
                              Visual capture pending
                            </Text>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* MODE 2: Split Curtain Slider (Sharp, zero-blur) */}
                  {visualMode === 'slider' && (
                    <div
                      style={{
                        borderRadius: 'var(--x-radius)',
                        border: '1px solid var(--x-border)',
                        padding: 'var(--x-space-4)',
                        backgroundColor: 'var(--x-surface-2)',
                      }}
                    >
                      {diffData.oldSnapshot?.screenshotUrl && diffData.newSnapshot?.screenshotUrl ? (
                        <Stack gap={14}>
                          <Group justify="between" align="center" gap={12}>
                            <Text styleKey="footnote" weight={300}>
                              Baseline (Left: {sliderPosition}%)
                            </Text>
                            <input
                              type="range"
                              min="1"
                              max="99"
                              value={sliderPosition}
                              onChange={(e) => setSliderPosition(Number(e.target.value))}
                              style={{
                                flex: 1,
                                accentColor: 'var(--x-accent)',
                                cursor: 'ew-resize',
                              }}
                            />
                            <Text styleKey="footnote" weight={300}>
                              Current (Right: {100 - sliderPosition}%)
                            </Text>
                          </Group>

                          {/* Sharp Split Viewport with Clip Path */}
                          <div
                            style={{
                              position: 'relative',
                              borderRadius: 'calc(var(--x-radius) - 2px)',
                              overflow: 'hidden',
                              border: '1px solid var(--x-border)',
                              backgroundColor: 'var(--x-bg)',
                              maxHeight: '520px',
                              display: 'flex',
                              justifyContent: 'center',
                              userSelect: 'none',
                            }}
                          >
                            {/* Current Image (Full Background) */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`${API_URL}${diffData.newSnapshot.screenshotUrl}`}
                              alt="Current Full"
                              style={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: '520px',
                                objectFit: 'contain',
                                display: 'block',
                                pointerEvents: 'none',
                              }}
                            />

                            {/* Baseline Image (Clipped sharply from left, ZERO BLUR) */}
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                overflow: 'hidden',
                                pointerEvents: 'none',
                                clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
                              }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={`${API_URL}${diffData.oldSnapshot.screenshotUrl}`}
                                alt="Baseline Clipped"
                                style={{
                                  width: '100%',
                                  height: 'auto',
                                  maxHeight: '520px',
                                  objectFit: 'contain',
                                  display: 'block',
                                }}
                              />
                            </div>

                            {/* Vertical Curtain Hairline */}
                            <div
                              style={{
                                position: 'absolute',
                                top: 0,
                                bottom: 0,
                                width: '1px',
                                backgroundColor: 'var(--x-accent)',
                                left: `${sliderPosition}%`,
                                pointerEvents: 'none',
                                zIndex: 20,
                              }}
                            >
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '50%',
                                  transform: 'translate(-50%, -50%)',
                                  padding: '2px 8px',
                                  borderRadius: 'var(--x-radius)',
                                  backgroundColor: 'var(--x-surface)',
                                  border: '1px solid var(--x-border)',
                                  whiteSpace: 'nowrap',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '11px',
                                  color: 'var(--x-text)',
                                }}
                              >
                                <Icon size="xs">
                                  <CaretLeft weight="thin" />
                                </Icon>
                                <span>Before</span>
                                <span style={{ opacity: 0.4 }}>|</span>
                                <span>After</span>
                                <Icon size="xs">
                                  <CaretRight weight="thin" />
                                </Icon>
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'center' }}>
                            <Text styleKey="caption1" tone="muted" weight={300}>
                              Zero-Blur Curtain: Drag slider horizontally to compare unaltered baseline vs updated layout
                            </Text>
                          </div>
                        </Stack>
                      ) : (
                        <div
                          style={{
                            height: '240px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 'var(--x-radius)',
                            border: '1px dashed var(--x-border)',
                            color: 'var(--x-text-muted)',
                          }}
                        >
                          <Icon size="md">
                            <Sliders weight="thin" />
                          </Icon>
                          <Text styleKey="footnote" tone="muted" weight={300}>
                            Curtain slider requires both baseline and current visual captures
                          </Text>
                        </div>
                      )}
                    </div>
                  )}

                  {/* MODE 3: Visual Diff Heatmap */}
                  {visualMode === 'heatmap' && (
                    <div
                      style={{
                        borderRadius: 'var(--x-radius)',
                        border: '1px solid var(--x-border)',
                        padding: 'var(--x-space-4)',
                        backgroundColor: 'var(--x-surface-2)',
                      }}
                    >
                      {hasVisualDiff ? (
                        <Stack gap={12}>
                          <Group justify="between" align="center">
                            <Heading level={3} styleKey="headline" weight={300}>
                              Pixel-Diff Alteration Highlights
                            </Heading>
                            <Group gap={12}>
                              <Group gap={4} align="center">
                                <span
                                  style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: '#ff0050',
                                  }}
                                />
                                <Text styleKey="caption1" tone="muted" weight={300}>
                                  Neon Red = Changed Elements
                                </Text>
                              </Group>
                              <Group gap={4} align="center">
                                <span
                                  style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--x-text-muted)',
                                  }}
                                />
                                <Text styleKey="caption1" tone="muted" weight={300}>
                                  Grayscale = Unchanged Structure
                                </Text>
                              </Group>
                            </Group>
                          </Group>

                          <div
                            style={{
                              borderRadius: 'calc(var(--x-radius) - 2px)',
                              overflow: 'hidden',
                              border: '1px solid var(--x-border)',
                              backgroundColor: 'var(--x-bg)',
                              padding: 'var(--x-space-2)',
                              display: 'flex',
                              justifyContent: 'center',
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`${API_URL}${diffData.visualDiff!.diffImageUrl}`}
                              alt="Visual Diff Heatmap"
                              style={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: '520px',
                                objectFit: 'contain',
                                borderRadius: 'calc(var(--x-radius) - 4px)',
                              }}
                            />
                          </div>
                        </Stack>
                      ) : (
                        <div
                          style={{
                            height: '240px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 'var(--x-radius)',
                            border: '1px dashed var(--x-border)',
                            color: 'var(--x-text-muted)',
                          }}
                        >
                          <Icon size="md">
                            <Flame weight="thin" />
                          </Icon>
                          <Text styleKey="footnote" tone="muted" weight={300}>
                            Heatmap requires baseline and current screenshots
                          </Text>
                        </div>
                      )}
                    </div>
                  )}
                </Stack>
              )}
            </Stack>
          ) : null}
        </div>

        {/* Modal Footer */}
        <Divider />
        <div
          style={{
            padding: 'var(--x-space-3) var(--x-space-6)',
            backgroundColor: 'var(--x-surface-2)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Button variant="subtle" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
