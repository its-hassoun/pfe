export type Role = 'Admin' | 'Agent' | 'Client' | 'SubClient';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  name?: string;
  avatarInitials?: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
  expiresAt: string;
}
