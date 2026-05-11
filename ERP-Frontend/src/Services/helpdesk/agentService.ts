import { helpdeskApi } from '../api';

export interface AgentDto {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string | null;
  role: string;
  poste: string;
  departement: string;
  isActive: boolean;
  agentType?: string | null;
  coutHoraire?: number | null;
  rating?: number | null;
  syncedAt: string;
}

export interface AgentStats {
  assigned: number;
  resolved: number;
  interventions: number;
}

export const agentService = {
  list: (search?: string): Promise<AgentDto[]> =>
    helpdeskApi.get('/agents', { params: { search } }).then(r => r.data),

  getById: (id: number): Promise<AgentDto> =>
    helpdeskApi.get(`/agents/${id}`).then(r => r.data),

  stats: (id: number): Promise<AgentStats> =>
    helpdeskApi.get(`/agents/${id}/stats`).then(r => r.data),
};
