export interface VideoUploadedPayload {
  videoId: string;
  channelId: string;
  uploaderId: string;
  storagePath: string;
  originalFilename: string;
}

export interface VideoTranscodedPayload {
  videoId: string;
  hlsManifestUrl: string;
  qualities: string[];
  durationSeconds: number;
}

export interface VideoViewPayload {
  videoId: string;
  userId: string | null;
  sessionId: string;
  watchedSeconds: number;
  completed: boolean;
  deviceType: string;
  countryCode: string;
}

export interface ModerationNeededPayload {
  resourceType: 'video' | 'comment' | 'message';
  resourceId: string;
  priority?: number;
}

export interface NotifyPushPayload {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface NotifyEmailPayload {
  to: string;
  template: string;
  variables: Record<string, string>;
}

export interface AnalyticsEventPayload {
  eventType: string;
  userId: string | null;
  sessionId: string;
  resourceType?: string;
  resourceId?: string;
  properties?: Record<string, unknown>;
  deviceType?: string;
  countryCode?: string;
}

export interface PaymentCompletedPayload {
  userId: string;
  paymentId: string;
  type: 'subscription' | 'creator_fee';
  amountUsd: number;
}

export interface SubscriptionActivatedPayload {
  userId: string;
  planId: number;
  expiresAt: string;
}
