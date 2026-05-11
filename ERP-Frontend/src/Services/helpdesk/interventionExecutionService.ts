import { helpdeskApi } from '../api';
import type {
  InterventionExecution,
  CreateInterventionPayload,
  InterventionStatut,
} from '../../types/interventionExecution';

export const interventionExecutionService = {
  list: (params?: { status?: string; agent?: string; client?: string; search?: string }): Promise<InterventionExecution[]> =>
    helpdeskApi.get('/intervention-executions', { params }).then(r => r.data),

  getById: (id: number): Promise<InterventionExecution> =>
    helpdeskApi.get(`/intervention-executions/${id}`).then(r => r.data),

  create: (payload: CreateInterventionPayload): Promise<InterventionExecution> =>
    helpdeskApi.post('/intervention-executions', payload).then(r => r.data),

  update: (id: number, payload: Partial<CreateInterventionPayload>): Promise<void> =>
    helpdeskApi.put(`/intervention-executions/${id}`, payload).then(() => undefined),

  assign: (id: number, agentId: string): Promise<void> =>
    helpdeskApi.patch(`/intervention-executions/${id}/assign`, { agentId }).then(() => undefined),

  changeStatus: (id: number, status: InterventionStatut): Promise<void> =>
    helpdeskApi.patch(`/intervention-executions/${id}/status`, { status }).then(() => undefined),

  report: (id: number, report: string): Promise<void> =>
    helpdeskApi.post(`/intervention-executions/${id}/report`, { report }).then(() => undefined),

  delete: (id: number): Promise<void> =>
    helpdeskApi.delete(`/intervention-executions/${id}`).then(() => undefined),
};
