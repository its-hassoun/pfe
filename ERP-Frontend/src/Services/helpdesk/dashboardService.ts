import { helpdeskApi } from '../api';
import type { DashboardStats, ActivityEvent, RecentTickets, RecentInterventions } from '../../types/dashboard';

export const dashboardService = {
  stats: (): Promise<DashboardStats> =>
    helpdeskApi.get('/dashboard/stats').then(r => r.data),

  recentTickets: (take = 5): Promise<RecentTickets> =>
    helpdeskApi.get('/dashboard/recent-tickets', { params: { take } }).then(r => r.data),

  recentInterventions: (take = 5): Promise<RecentInterventions> =>
    helpdeskApi.get('/dashboard/recent-interventions', { params: { take } }).then(r => r.data),

  activity: (take = 20): Promise<ActivityEvent[]> =>
    helpdeskApi.get('/dashboard/activity', { params: { take } }).then(r => r.data),
};
