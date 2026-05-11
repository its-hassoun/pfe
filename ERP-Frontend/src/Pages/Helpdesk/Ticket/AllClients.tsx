import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Building2,
  Loader2,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { clientService, type CompanyDto } from '../../../Services/helpdesk/clientService';

export function AllClients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<CompanyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  const fetchAll = () => {
    setLoading(true);
    setError(false);
    clientService.list()
      .then(setClients)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(fetchAll, []);

  const filtered = clients.filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      c.raisonSociale.toLowerCase().includes(q) ||
      (c.emailPrincipal ?? '').toLowerCase().includes(q) ||
      (c.ville ?? '').toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#ef7c21]" />
        <span className="ml-3 text-slate-500 font-medium">Chargement des clients…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-slate-500 font-medium">Impossible de charger les clients.</p>
        <Button variant="outline" onClick={fetchAll}>Réessayer</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Client Directory</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ef7c21]" />
            Gestion de la base client
          </p>
        </div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          La création de client se fait depuis le module CRM
        </div>
      </div>

      <Card className="overflow-hidden border-none shadow-2xl bg-white rounded-[2.5rem]" noPadding>
        <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un client ou entreprise..."
              className="w-full pl-11 pr-4 py-4 bg-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#ef7c21]/20 transition-all placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
          <button className="flex items-center bg-slate-100 hover:bg-slate-200 text-slate-500 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
            <Filter className="h-3.5 w-3.5 mr-2" /> Filtrer
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Entreprise</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Secteur</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Ville</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</th>
                <th className="relative px-8 py-5"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors cursor-pointer group" onClick={() => navigate(`/clients/${c.id}`)}>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex items-center">
                      <Avatar initials={c.raisonSociale.slice(0, 2)} size="md" className="shadow-sm font-bold bg-slate-100 text-[#ef7c21]" />
                      <div className="ml-4">
                        <div className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" /> {c.raisonSociale}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap text-xs font-black text-slate-500 uppercase tracking-widest italic">{c.secteur ?? '—'}</td>
                  <td className="px-8 py-6 whitespace-nowrap text-xs font-black text-slate-500 uppercase tracking-widest italic">{c.ville ?? '—'}</td>
                  <td className="px-8 py-6 whitespace-nowrap text-xs text-slate-500 italic">{c.emailPrincipal ?? '—'}</td>
                  <td className="px-8 py-6 text-right">
                    <MoreHorizontal className="h-5 w-5 text-slate-300 group-hover:text-slate-600" />
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={5} className="px-8 py-16 text-center text-slate-500">Aucun client.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
            Page {page} sur {totalPages}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </Card>
    </div>
  );
}
