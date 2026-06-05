export const RABBITMQ_EXCHANGE = 'safestream.events';

export const Events = {
  // User events
  USER_REGISTERED:       'user.registered',
  USER_EMAIL_VERIFIED:   'user.email.verified',
  USER_BANNED:           'user.banned',

  // Video events
  VIDEO_UPLOADED:        'video.uploaded',
  VIDEO_TRANSCODED:      'video.transcoded',
  VIDEO_PUBLISHED:       'video.published',
  VIDEO_REJECTED:        'video.rejected',
  VIDEO_DELETED:         'video.deleted',
  VIDEO_VIEW:            'video.view',

  // Channel events
  CHANNEL_CREATED:       'channel.created',
  CHANNEL_SUBSCRIBED:    'channel.subscribed',
  CHANNEL_UNSUBSCRIBED:  'channel.unsubscribed',

  // Comment events
  COMMENT_CREATED:       'comment.created',
  COMMENT_REPORTED:      'comment.reported',

  // Moderation events
  MODERATION_NEEDED:     'moderation.needed',
  MODERATION_APPROVED:   'moderation.approved',
  MODERATION_REJECTED:   'moderation.rejected',

  // Payment events
  PAYMENT_COMPLETED:     'payment.completed',
  PAYMENT_FAILED:        'payment.failed',
  SUBSCRIPTION_ACTIVATED:'subscription.activated',
  SUBSCRIPTION_EXPIRED:  'subscription.expired',

  // Notification events
  NOTIFY_PUSH:           'notify.push',
  NOTIFY_EMAIL:          'notify.email',
  NOTIFY_IN_APP:         'notify.in_app',

  // Analytics events
  ANALYTICS_EVENT:       'analytics.event',
} as const;

export type EventName = (typeof Events)[keyof typeof Events];
