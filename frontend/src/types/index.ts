export type Competitor = {
  id: string;
  url: string;
  createdAt: string;
};

export type Snapshot = {
  id: string;
  url: string;
  pageTitle: string | null;
  status: string;
  capturedAt: string;
};

export type AiSummary = {
  id: string;
  analysis: string;
  significance: string;
  createdAt: string;
};

export type Change = {
  id: string;
  hasChanges: boolean;
  diffSummary: string | null;
  detectedAt: string;
  aiSummary?: AiSummary | null;
};

export type Alert = {
  id: string;
  competitorId: string;
  changeId?: string | null;
  title: string;
  message: string;
  significance: string;
  isRead: boolean;
  createdAt: string;
  competitor?: Competitor;
};

export type DiffChunk = {
  value: string;
  added: boolean;
  removed: boolean;
};

export type SnapshotHeader = {
  id: string;
  capturedAt: string;
  pageTitle: string | null;
  url: string;
};

export type ChangeDiffResult = {
  changeId: string;
  competitorId: string;
  detectedAt: string;
  diffSummary: string | null;
  hasChanges: boolean;
  oldSnapshot: SnapshotHeader | null;
  newSnapshot: SnapshotHeader | null;
  diffChunks: DiffChunk[];
  aiSummary?: AiSummary | null;
};

export type PricingPlan = {
  id: string;
  competitorId: string;
  snapshotId?: string | null;
  name: string;
  price: string;
  period?: string | null;
  features?: string | null;
  updatedAt: string;
};

export type ExecutiveReport = {
  competitorId: string;
  competitorUrl: string;
  generatedAt: string;
  reportMarkdown: string;
};



