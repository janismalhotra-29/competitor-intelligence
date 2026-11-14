'use client';

import React from 'react';
import { CommandPalette, Icon } from '@xenon-kit/web';
import {
  Globe,
  Plus,
  GitDiff,
  CurrencyDollar,
  Bell,
  ArrowClockwise,
} from '@phosphor-icons/react';
import type { Competitor } from '@/types';

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url.replace(/https?:\/\//, '').split('/')[0] || url;
  }
}

interface CommandPaletteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitors: Competitor[];
  onSelectTab: (tab: string) => void;
  onFocusAdd: () => void;
  onTriggerCollect?: (id: string) => void;
  onSelectCompetitor?: (id: string) => void;
}

export function CommandPaletteModal({
  open,
  onOpenChange,
  competitors,
  onSelectTab,
  onFocusAdd,
  onTriggerCollect,
  onSelectCompetitor,
}: CommandPaletteModalProps) {
  const items = [
    {
      id: 'action-add',
      label: 'Track New Competitor URL',
      group: 'Quick Actions',
      icon: (
        <Icon size="sm">
          <Plus weight="thin" />
        </Icon>
      ),
      shortcut: '⌘N',
      onSelect: () => {
        onOpenChange(false);
        onFocusAdd();
      },
    },
    {
      id: 'nav-competitors',
      label: 'Go to Competitors Overview',
      group: 'Navigation',
      icon: (
        <Icon size="sm">
          <Globe weight="thin" />
        </Icon>
      ),
      shortcut: '⌘1',
      onSelect: () => {
        onOpenChange(false);
        onSelectTab('competitors');
      },
    },
    {
      id: 'nav-diffs',
      label: 'Go to Visual Diff Gallery',
      group: 'Navigation',
      icon: (
        <Icon size="sm">
          <GitDiff weight="thin" />
        </Icon>
      ),
      shortcut: '⌘2',
      onSelect: () => {
        onOpenChange(false);
        onSelectTab('diffs');
      },
    },
    {
      id: 'nav-pricing',
      label: 'Go to Pricing Intelligence Matrix',
      group: 'Navigation',
      icon: (
        <Icon size="sm">
          <CurrencyDollar weight="thin" />
        </Icon>
      ),
      shortcut: '⌘3',
      onSelect: () => {
        onOpenChange(false);
        onSelectTab('pricing');
      },
    },
    {
      id: 'nav-alerts',
      label: 'Go to Alerts & Activity Trail',
      group: 'Navigation',
      icon: (
        <Icon size="sm">
          <Bell weight="thin" />
        </Icon>
      ),
      shortcut: '⌘4',
      onSelect: () => {
        onOpenChange(false);
        onSelectTab('alerts');
      },
    },
    ...competitors.map((c) => ({
      id: `comp-${c.id}`,
      label: `Inspect ${extractDomain(c.url)}`,
      group: 'Tracked Competitors',
      icon: (
        <Icon size="sm">
          <Globe weight="thin" />
        </Icon>
      ),
      onSelect: () => {
        onOpenChange(false);
        onSelectTab('competitors');
        if (onSelectCompetitor) onSelectCompetitor(c.id);
      },
    })),
    ...competitors.map((c) => ({
      id: `crawl-${c.id}`,
      label: `Trigger Instant Crawl: ${extractDomain(c.url)}`,
      group: 'Autonomous Crawling',
      icon: (
        <Icon size="sm">
          <ArrowClockwise weight="thin" />
        </Icon>
      ),
      onSelect: () => {
        onOpenChange(false);
        if (onTriggerCollect) onTriggerCollect(c.id);
      },
    })),
  ];

  return (
    <CommandPalette
      open={open}
      onOpenChange={onOpenChange}
      placeholder="Type a domain, command or shortcut (e.g. 'crawl', 'pricing')..."
      emptyText="No matching commands or competitors found."
      shortcutKey="⌘K"
      items={items}
    />
  );
}
