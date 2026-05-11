import { helpdeskApi } from '../api';
import type { ActivityEvent } from '../../types/dashboard';

export const ticketHistoryService = {
  get: (ticketId: number): Promise<ActivityEvent[]> =>
    helpdeskApi.get(`/tickets/${ticketId}/history`).then(r => r.data),
};
