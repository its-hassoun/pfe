import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  Loader2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Wrench,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { interventionExecutionService } from '../../../Services/helpdesk/interventionExecutionService';
import {
  InterventionStatut,
  InterventionStatutLabel,
  type InterventionExecution,
} from '../../../types/interventionExecution';
import { CreateInterventionModal } from './CreateInterventionModal';
import { useAuth } from '../../../contexts/AuthContext';

const STATUS_TABS = [
  { value: 'all', label: 'Toutes' },
  { value: String(InterventionStatut.Pending), label: 'En attente' },
  { value: String(InterventionStatut.Scheduled), label: 'Planifiées' },
  { value: String(InterventionStatut.InProgress), label: 'En cours' },
  { value: String(InterventionStatut.Completed), label: 'Terminées' },
  { value: String(InterventionStatut.Cancelled), label: 'Annulées' },
];

function statusColor(s: InterventionStatut) {
  switch (s) {
    case InterventionStatut.Pending: return 'bg-amber-100 text-amber-700';
    case InterventionStatut.Scheduled: return 'bg-blue-100 text-blue-700';
    case InterventionStatut.InProgress: return 'bg-emerald-100 text-emerald-700';
    case InterventionStatut.Completed: return 'bg-slate-100 text-slate-600';
    case InterventionStatut.Cancelled: return 'bg-red-100 text-red-700';
  }
}

export function InterventionsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isStaff = user?.role === 'Admin' || user?.role === 'Agent';

  const [items, setItems] = useState<InterventionExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const itemsPerPage = 10;

  const fetchAll = () => {
    setLoading(true);
    setError(false);
    interventionExecutionService.list()
      .then(setItems)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(fetchAll, []);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (tab !== 'all' && String(i.statut) !== tab) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          i.titre.toLowerCase().includes(q) ||
          (i.description ?? '').toLowerCase().includes(q) ||
          (i.clientId ?? '').toLowerCase().includes(q) ||
          String(i.id).includes(q)
        );
      }
      return true;
    });
  }, [items, tab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#ef7c21]" />
        <span className="ml-3 text-slate-500 font-medium">Chargement des interventions…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-slate-500 font-medium">Impossible de charger les interventions.</p>
        <Button onClick={fetchAll} variant="outline">Réessayer</Button>
      </div>
    );
  }

  return (
    <>
      <CreateInterventionModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onCreated={(created) => setItems((prev) => [created, ...prev])}
      />

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Interventions</h2>
            <p className="text-sm text-slate-500">Suivi et planification des interventions terrain &amp; à distance</p>
          </div>
          {isStaff && (
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle intervention
            </Button>
          )}
        </div>

        <Card className="flex flex-col" noPadding>
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher une intervention…"
                className="w-full pl-9 pr-4 py-2 rounded-md border border-slate-300 text-sm focus:ring-2 focus:ring-[#ef7c21] focus:border-transparent"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Button variant="outline" size="sm" className="whitespace-nowrap" onClick={() => { setTab('all'); setPage(1); }}>
              <Filter className="h-3 w-3 mr-2" /> Reset filtre
            </Button>
          </div>

          <div className="flex border-b border-slate-200 px-4 bg-slate-50 overflow-x-auto">
            {STATUS_TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => { setTab(t.value); setPage(1); }}
                className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                  tab === t.value ? 'border-[#ef7c21] text-[#ef7c21]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {t.label}
                <span className="ml-2 bg-slate-200 text-slate-600 py-0.5 px-2 rounded-full text-xs">
                  {t.value === 'all' ? items.length : items.filter((i) => String(i.statut) === t.value).length}
                </span>
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Titre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Planifiée</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</th>
                  <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {paginated.map((i) => (
                  <tr
                    key={i.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/interventions/${i.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-orange-50 text-[#ef7c21] flex items-center justify-center shrink-0">
                          <Wrench className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate max-w-xs">{i.titre}</p>
                          <p className="text-xs text-slate-400 truncate max-w-xs">{i.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{i.clientId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{i.assignedAgentId ?? '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {i.scheduledAt ? new Date(i.scheduledAt).toLocaleString('fr-FR') : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColor(i.statut)}`}>
                        {InterventionStatutLabel[i.statut]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <Search className="h-12 w-12 text-slate-300 mb-4" />
                        <p className="text-lg font-medium text-slate-900">Aucune intervention</p>
                        <p className="text-sm text-slate-500">Modifiez vos filtres ou créez-en une.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-white px-4 py-3 border-t border-slate-200 flex items-center justify-between sm:px-6">
            <p className="text-sm text-slate-700">
              Affichage <span className="font-medium">{filtered.length === 0 ? 0 : (page - 1) * itemsPerPage + 1}</span> à{' '}
              <span className="font-medium">{Math.min(page * itemsPerPage, filtered.length)}</span> sur{' '}
              <span className="font-medium">{filtered.length}</span>
            </p>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setPage(idx + 1)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    page === idx + 1 ? 'z-10 bg-orange-50 border-[#ef7c21] text-[#ef7c21]' : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </Card>
      </div>
    </>
  );
}
