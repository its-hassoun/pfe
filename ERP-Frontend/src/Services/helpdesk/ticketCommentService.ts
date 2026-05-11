import { helpdeskApi } from '../api';
import type { MessageTicket } from '../../types/helpdesk';

export const ticketCommentService = {
  list: (ticketId: number): Promise<MessageTicket[]> =>
    helpdeskApi.get(`/tickets/${ticketId}/comments`).then(r => r.data),

  add: (ticketId: number, content: string): Promise<MessageTicket> =>
    helpdeskApi.post(`/tickets/${ticketId}/comments`, { content }).then(r => r.data),
};
