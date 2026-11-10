'use client';

import { FormEvent, useState } from 'react';
import { Input, Button, Group, Icon } from '@xenon-kit/web';
import { Globe, Plus } from '@phosphor-icons/react';

interface Props {
  submitCompetitor: (url: string) => Promise<void>;
  adding: boolean;
}

export function AddCompetitorForm({ submitCompetitor, adding }: Props) {
  const [url, setUrl] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    await submitCompetitor(url.trim());
    setUrl('');
  }

  return (
    <form onSubmit={onSubmit}>
      <Group gap={12} align="center">
        <div style={{ flex: 1 }}>
          <Input
            type="url"
            placeholder="Enter competitor URL (e.g., https://stripe.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            size="md"
            prefix={
              <Icon size="sm">
                <Globe weight="thin" />
              </Icon>
            }
          />
        </div>
        <Button type="submit" variant="accent" size="md" loading={adding}>
          <Icon size="sm">
            <Plus weight="thin" />
          </Icon>
          <span>Track</span>
        </Button>
      </Group>
    </form>
  );
}
