import type { CategorieAction, PrioriteTicket, Ticket } from './helpdesk';

export const InterventionStatut = {
  Pending: 0,
  Scheduled: 1,
  InProgress: 2,
  Completed: 3,
  Cancelled: 4,
} as const;
export type InterventionStatut = typeof InterventionStatut[keyof typeof InterventionStatut];

export const InterventionStatutLabel: Record<InterventionStatut, string> = {
  [InterventionStatut.Pending]: 'En attente',
  [InterventionStatut.Scheduled]: 'Planifiée',
  [InterventionStatut.InProgress]: 'En cours',
  [InterventionStatut.Completed]: 'Terminée',
  [InterventionStatut.Cancelled]: 'Annulée',
};

export interface InterventionExecution {
  id: number;
  ticketId?: number | null;
  ticket?: Ticket | null;
  interventionCatalogId?: number | null;
  clientId: string;
  sousClientId?: string | null;
  assignedAgentId?: string | null;
  titre: string;
  description?: string | null;
  categorie: CategorieAction;
  priorite: PrioriteTicket;
  statut: InterventionStatut;
  scheduledAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  location?: string | null;
  isRemote: boolean;
  rapportResolution?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInterventionPayload {
  ticketId?: number | null;
  interventionCatalogId?: number | null;
  clientId: string;
  sousClientId?: string | null;
  assignedAgentId?: string | null;
  titre: string;
  description?: string | null;
  categorie: CategorieAction;
  priorite: PrioriteTicket;
  scheduledAt?: string | null;
  location?: string | null;
  isRemote: boolean;
}
