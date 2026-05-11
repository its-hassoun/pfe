import { helpdeskApi } from '../api';
import type { AppNotification } from '../../types/notification';

export const notificationService = {
  list: (params?: { unreadOnly?: boolean; take?: number; skip?: number }): Promise<AppNotification[]> =>
    helpdeskApi.get('/notifications', { params }).then(r => r.data),

  unreadCount: (): Promise<number> =>
    helpdeskApi.get('/notifications/unread-count').then(r => r.data?.count ?? 0),

  markRead: (id: number): Promise<void> =>
    helpdeskApi.patch(`/notifications/${id}/read`).then(() => undefined),

  markAllRead: (): Promise<number> =>
    helpdeskApi.patch('/notifications/read-all').then(r => r.data?.count ?? 0),

  delete: (id: number): Promise<void> =>
    helpdeskApi.delete(`/notifications/${id}`).then(() => undefined),
};
