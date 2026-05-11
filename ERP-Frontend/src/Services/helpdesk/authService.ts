import { helpdeskApi } from '../api';
import type { AuthUser, LoginResponse } from '../../types/auth';

export const authService = {
  login: (email: string, password: string): Promise<LoginResponse> =>
    helpdeskApi.post('/auth/login', { email, password }).then(r => r.data),

  me: (): Promise<AuthUser> =>
    helpdeskApi.get('/auth/me').then(r => r.data),

  logout: (): Promise<void> =>
    helpdeskApi.post('/auth/logout').then(() => undefined),

  register: (payload: { email: string; password: string; role: string; userId?: string }) =>
    helpdeskApi.post('/auth/register', payload).then(r => r.data),
};
