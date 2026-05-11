import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { clientService, type CompanyDto, type ContactDto } from '../../../Services/helpdesk/clientService';
import type { Ticket } from '../../../types/helpdesk';
import { Building2, ChevronLeft, Loader2, Mail, Phone } from 'lucide-react';

export function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<CompanyDto | null>(null);
  const [contacts, setContacts] = useState<ContactDto[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAll = () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    Promise.all([clientService.getById(Number(id)), clientService.tickets(Number(id))])
      .then(([data, t]) => { setCompany(data.company); setContacts(data.contacts); setTickets(t); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(fetchAll, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#ef7c21]" />
        <span className="ml-3 text-slate-500 font-medium">Chargement…</span>
      </div>
    );
  }
  if (error || !company) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-slate-500 font-medium">Client introuvable.</p>
        <Button variant="outline" onClick={() => navigate('/clients')}>Retour</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/clients')} className="flex items-center text-xs font-black uppercase tracking-widest text-slate-400 hover:text-[#ef7c21]">
        <ChevronLeft className="h-4 w-4 mr-1" /> Retour
      </button>

      <Card className="p-8 rounded-[2rem] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-orange-50 text-[#ef7c21] flex items-center justify-center"><Building2 className="h-7 w-7" /></div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">{company.raisonSociale}</h2>
            <p className="text-sm text-slate-500">{company.secteur ?? '—'}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
              {company.ville ?? '—'} • {company.pays ?? '—'}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 space-y-2 text-sm text-slate-700">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Coordonnées</p>
          <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /> {company.emailPrincipal ?? '—'}</p>
          <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /> {company.telephonePrincipal ?? '—'}</p>
          <p className="text-xs text-slate-500">{company.adresse ?? '—'}</p>
        </Card>
        <Card className="p-6 space-y-2 text-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">SLA</p>
          <p>Max heures par ticket: <span className="font-bold">{company.maxHeuresTraitementTicket ?? '—'}</span></p>
        </Card>
      </div>

      <Card noPadding>
        <div className="px-6 py-4 border-b border-slate-100"><h3 className="font-bold text-slate-900">Contacts</h3></div>
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nom</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Téléphone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Poste</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-6 py-3">{c.prenom} {c.nom}</td>
                <td className="px-6 py-3">{c.email}</td>
                <td className="px-6 py-3">{c.telephone ?? '—'}</td>
                <td className="px-6 py-3">{c.poste ?? '—'}</td>
              </tr>
            ))}
            {contacts.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Aucun contact.</td></tr>}
          </tbody>
        </table>
      </Card>

      <Card noPadding>
        <div className="px-6 py-4 border-b border-slate-100"><h3 className="font-bold text-slate-900">Tickets récents</h3></div>
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Sujet</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/tickets/${t.id}`)}>
                <td className="px-6 py-3">{t.titre}</td>
                <td className="px-6 py-3">{t.statut}</td>
                <td className="px-6 py-3">{new Date(t.dateCreation).toLocaleDateString('fr-FR')}</td>
              </tr>
            ))}
            {tickets.length === 0 && <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">Aucun ticket.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
