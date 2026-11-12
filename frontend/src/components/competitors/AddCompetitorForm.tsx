'use client';

import { FormEvent, useState } from 'react';
import { Field, Input, Button, Group, Icon, toast } from '@xenon-kit/web';
import { Globe, Plus } from '@phosphor-icons/react';

interface Props {
  submitCompetitor: (url: string) => Promise<void>;
  adding: boolean;
  error?: string | null;
}

export function AddCompetitorForm({ submitCompetitor, adding, error }: Props) {
  const [url, setUrl] = useState('');
  const [validationError, setValidationError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!url.trim()) {
      setValidationError('Please enter a valid website URL.');
      return;
    }
    setValidationError('');
    try {
      const targetUrl = url.trim();
      await submitCompetitor(targetUrl);
      setUrl('');
      toast.success('Competitor Tracked', {
        description: `Successfully added ${targetUrl}. Initial viewport crawl queued.`,
      });
    } catch {
      // Error handled by parent mutations
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Field
        label="Track New Competitor"
        helpText="Enter a domain or landing page URL (e.g. https://stripe.com)"
        error={validationError || (error ? error : undefined)}
      >
        <Group gap={8} align="center">
          <div style={{ flex: 1 }}>
            <Input
              id="competitor-url-input"
              type="url"
              placeholder="https://company.com"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (validationError) setValidationError('');
              }}
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
            <span>Track URL</span>
          </Button>
        </Group>
      </Field>
    </form>
  );
}
