import { helpdeskApi } from '../api';
import type { Ticket } from '../../types/helpdesk';

export interface CompanyDto {
  id: number;
  raisonSociale: string;
  secteur?: string | null;
  emailPrincipal?: string | null;
  telephonePrincipal?: string | null;
  adresse?: string | null;
  codePostal?: string | null;
  ville?: string | null;
  pays?: string | null;
  matriculeFiscal?: string | null;
  statut?: string | null;
  maxHeuresTraitementTicket?: number | null;
  syncedAt: string;
}

export interface ContactDto {
  id: number;
  companyId: number;
  nom: string;
  prenom: string;
  poste?: string | null;
  email: string;
  telephone?: string | null;
  telephoneCountry?: string | null;
  isActive: boolean;
}

export const clientService = {
  list: (search?: string): Promise<CompanyDto[]> =>
    helpdeskApi.get('/clients', { params: { search } }).then(r => r.data),

  getById: (id: number): Promise<{ company: CompanyDto; contacts: ContactDto[] }> =>
    helpdeskApi.get(`/clients/${id}`).then(r => r.data),

  contacts: (id: number): Promise<ContactDto[]> =>
    helpdeskApi.get(`/clients/${id}/contacts`).then(r => r.data),

  tickets: (id: number): Promise<Ticket[]> =>
    helpdeskApi.get(`/clients/${id}/tickets`).then(r => r.data),
};
