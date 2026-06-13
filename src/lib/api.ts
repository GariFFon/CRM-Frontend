// ─── Central API client — all backend calls go through here ──────────────────
const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `Request failed: ${res.status}`);
  }

  return res.json();
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  totalSpend: string;
  orderCount: number;
  avgOrderValue: string;
  lastOrderAt: string | null;
  favouriteCategory: string;
  createdAt: string;
};

export type Order = {
  id: string;
  customerId: string;
  amount: string;
  items: Array<{ name: string; category: string; price: number; qty: number }>;
  orderedAt: string;
};

export type SegmentCondition = {
  field: string;
  op: string;
  value: string | number | string[];
};

export type SegmentRules = {
  operator: 'AND' | 'OR';
  conditions: SegmentCondition[];
};

export type Segment = {
  id: string;
  name: string;
  description: string | null;
  rules: SegmentRules;
  customerCount: number;
  createdAt: string;
};

export type CampaignStats = {
  campaignId: string;
  total: number;
  queued: number;
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  clicked: number;
  rates: { delivery: number; open: number; click: number; fail: number };
  lastUpdatedAt: string;
};

export type Campaign = {
  id: string;
  name: string;
  segmentId: string;
  channel: 'whatsapp' | 'sms' | 'email' | 'rcs';
  messageTemplate: string;
  status: 'draft' | 'active' | 'completed';
  launchedAt: string | null;
  createdAt: string;
  stats?: CampaignStats;
};

export type Message = {
  id: string;
  campaignId: string;
  customerId: string;
  channel: string;
  recipientContact: string;
  messageBody: string;
  status: string;
  vendorRef: string | null;
  queuedAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
};

export type DashboardData = {
  totalCustomers: number;
  totalSegments: number;
  totalCampaigns: number;
  avgDeliveryRate: number;
  recentCampaigns: Campaign[];
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

// ─── Customers ────────────────────────────────────────────────────────────────

export const api = {
  // Dashboard
  dashboard: {
    get: () => request<{ success: boolean; data: DashboardData }>('/dashboard'),
  },

  // Customers
  customers: {
    list: (page = 1, limit = 20, search?: string) => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(search ? { search } : {}),
      });
      return request<{ success: boolean; data: Customer[]; pagination: Pagination }>(
        `/customers?${params}`
      );
    },
    get: (id: string) =>
      request<{ success: boolean; data: Customer & { orders: Order[] } }>(
        `/customers/${id}`
      ),
  },

  // Segments
  segments: {
    list: () => request<{ success: boolean; data: Segment[] }>('/segments'),
    get: (id: string) =>
      request<{ success: boolean; data: Segment }>(`/segments/${id}`),
    create: (body: { name: string; description?: string; rules: SegmentRules }) =>
      request<{ success: boolean; data: Segment }>('/segments', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/segments/${id}`, { method: 'DELETE' }),
    preview: (rules: SegmentRules) =>
      request<{ success: boolean; data: { count: number; samples: Customer[] } }>(
        '/segments/preview-rules',
        { method: 'POST', body: JSON.stringify({ rules }) }
      ),
  },

  // Campaigns
  campaigns: {
    list: () => request<{ success: boolean; data: Campaign[] }>('/campaigns'),
    get: (id: string) =>
      request<{ success: boolean; data: Campaign }>(`/campaigns/${id}`),
    create: (body: {
      name: string;
      segmentId: string;
      channel: string;
      messageTemplate: string;
    }) =>
      request<{ success: boolean; data: Campaign }>('/campaigns', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    launch: (id: string) =>
      request<{ success: boolean; data: { campaignId: string; messagesQueued: number } }>(
        `/campaigns/${id}/launch`,
        { method: 'POST' }
      ),
    stats: (id: string) =>
      request<{ success: boolean; data: CampaignStats }>(`/campaigns/${id}/stats`),
    messages: (id: string) =>
      request<{ success: boolean; data: Message[] }>(`/campaigns/${id}/messages`),
  },

  // AI
  ai: {
    generateSegment: (query: string) =>
      request<{ success: boolean; data: { rules: SegmentRules; explanation: string } }>(
        '/ai/segment',
        { method: 'POST', body: JSON.stringify({ query }) }
      ),
    generateCopy: (campaignGoal: string, segmentId: string, channel: string) =>
      request<{
        success: boolean;
        data: Array<{ variant: string; copy: string }>;
      }>('/ai/copy', {
        method: 'POST',
        body: JSON.stringify({ campaignGoal, segmentId, channel }),
      }),
    recommendChannel: (segmentId: string) =>
      request<{
        success: boolean;
        data: { channel: string; reasoning: string };
      }>('/ai/channel', {
        method: 'POST',
        body: JSON.stringify({ segmentId }),
      }),
    generateInsights: (campaignId: string) =>
      request<{ success: boolean; data: { insights: string } }>('/ai/insights', {
        method: 'POST',
        body: JSON.stringify({ campaignId }),
      }),
  },
};
