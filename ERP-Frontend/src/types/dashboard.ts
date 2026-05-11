import type { Ticket } from './helpdesk';
import type { InterventionExecution } from './interventionExecution';

export interface DashboardStats {
  tickets: {
    total: number;
    nouveau: number;
    enAttente: number;
    ouvert: number;
    enPause: number;
    clos: number;
    rejete: number;
  };
  interventions: {
    total: number;
    pending: number;
    scheduled: number;
    inProgress: number;
    completed: number;
  };
}

export interface ActivityEvent {
  id: number;
  ticketId: number;
  actorUserId: string;
  action: number;
  fromValue?: string | null;
  toValue?: string | null;
  note?: string | null;
  createdAt: string;
}

export type RecentTickets = Ticket[];
export type RecentInterventions = InterventionExecution[];
