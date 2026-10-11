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

