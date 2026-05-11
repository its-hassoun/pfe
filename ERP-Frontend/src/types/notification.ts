export const NotificationType = {
  TicketTransferred: 0,
  TicketAssigned: 1,
  TicketStatusChanged: 2,
  TicketCompleted: 3,
  TicketCommentAdded: 4,
  InterventionCreated: 5,
  InterventionAssigned: 6,
  InterventionScheduled: 7,
  InterventionCompleted: 8,
  InterventionCancelled: 9,
  PriorityChanged: 10,
  ClientReplyRequired: 11,
  SlaWarning: 12,
} as const;
export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

export interface AppNotification {
  id: number;
  recipientUserId: string;
  actorUserId?: string | null;
  type: NotificationType;
  typeName?: string;
  title: string;
  message: string;
  ticketId?: number | null;
  interventionId?: number | null;
  metadata?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}
