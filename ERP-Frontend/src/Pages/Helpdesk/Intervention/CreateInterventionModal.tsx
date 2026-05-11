import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { interventionExecutionService } from '../../../Services/helpdesk/interventionExecutionService';
import { interventionService } from '../../../Services/helpdesk/interventionService';
import { agentService, type AgentDto } from '../../../Services/helpdesk/agentService';
import { clientService, type CompanyDto } from '../../../Services/helpdesk/clientService';
import { CategorieAction, PrioriteTicket } from '../../../types/helpdesk';
import type { Intervention as InterventionCatalog } from '../../../types/helpdesk';
import {
  type CreateInterventionPayload,
  type InterventionExecution,
} from '../../../types/interventionExecution';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (i: InterventionExecution) => void;
  defaultTicketId?: number;
}

export function CreateInterventionModal({ isOpen, onClose, onCreated, defaultTicketId }: Props) {
  const [form, setForm] = useState<CreateInterventionPayload>({
    ticketId: defaultTicketId ?? null,
    interventionCatalogId: null,
    clientId: '',
    sousClientId: null,
    assignedAgentId: null,
    titre: '',
    description: '',
    categorie: CategorieAction.HelpDesk,
    priorite: PrioriteTicket.Moyenne,
    scheduledAt: null,
    location: null,
    isRemote: false,
  });

  const [catalogs, setCatalogs] = useState<InterventionCatalog[]>([]);
  const [agents, setAgents] = useState<AgentDto[]>([]);
  const [clients, setClients] = useState<CompanyDto[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [refsError, setRefsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingRefs(true);
    setRefsError(false);
    Promise.all([
      interventionService.getAll().catch(() => []),
      agentService.list().catch(() => []),
      clientService.list().catch(() => []),
    ])
      .then(([c, a, cl]) => {
        setCatalogs(c);
        setAgents(a);
        setClients(cl);
      })
      .catch(() => setRefsError(true))
      .finally(() => setLoadingRefs(false));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.titre.trim() || !form.clientId.trim()) {
      setError('Titre et client sont requis.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await interventionExecutionService.create(form);
      onCreated(created);
      setForm({
        ticketId: defaultTicketId ?? null,
        interventionCatalogId: null,
        clientId: '',
        sousClientId: null,
        assignedAgentId: null,
        titre: '',
        description: '',
        categorie: CategorieAction.HelpDesk,
        priorite: PrioriteTicket.Moyenne,
        scheduledAt: null,
        location: null,
        isRemote: false,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Création impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Nouvelle Intervention</h2>
            <p className="text-sm text-slate-500 font-medium">Planifiez ou consignez une intervention</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {loadingRefs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#ef7c21]" />
              <span className="ml-2 text-sm text-slate-500 font-medium">Chargement…</span>
            </div>
          ) : (
            <form id="create-intervention-form" onSubmit={handleSubmit} className="space-y-5">
              {refsError && (
                <p className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                  Certaines données de référence sont indisponibles ; vous pouvez quand même saisir manuellement.
                </p>
              )}
              {error && (
                <p className="text-xs font-bold text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <Input
                label="Titre"
                required
                value={form.titre}
                onChange={(e) => setForm({ ...form, titre: e.target.value })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Catalogue d'intervention (optionnel)"
                  options={[
                    { value: '', label: '—' },
                    ...catalogs.map((c) => ({ value: String(c.id), label: c.nom })),
                  ]}
                  value={form.interventionCatalogId ? String(form.interventionCatalogId) : ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      interventionCatalogId: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
                <Select
                  label="Catégorie"
                  options={[
                    { value: String(CategorieAction.HelpDesk), label: 'HelpDesk' },
                    { value: String(CategorieAction.Developpement), label: 'Développement' },
                    { value: String(CategorieAction.Windows), label: 'Windows' },
                  ]}
                  value={String(form.categorie)}
                  onChange={(e) => setForm({ ...form, categorie: Number(e.target.value) as CategorieAction })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Client"
                  required
                  options={[
                    { value: '', label: 'Sélectionner…' },
                    ...clients.map((c) => ({ value: String(c.id), label: c.raisonSociale })),
                  ]}
                  value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                />
                <Select
                  label="Agent assigné"
                  options={[
                    { value: '', label: 'Non assigné' },
                    ...agents.map((a) => ({ value: String(a.id), label: `${a.prenom} ${a.nom}`.trim() })),
                  ]}
                  value={form.assignedAgentId ?? ''}
                  onChange={(e) => setForm({ ...form, assignedAgentId: e.target.value || null })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Priorité"
                  options={[
                    { value: String(PrioriteTicket.Basse), label: 'Basse' },
                    { value: String(PrioriteTicket.Moyenne), label: 'Moyenne' },
                    { value: String(PrioriteTicket.Haute), label: 'Haute' },
                    { value: String(PrioriteTicket.Critique), label: 'Critique' },
                  ]}
                  value={String(form.priorite)}
                  onChange={(e) => setForm({ ...form, priorite: Number(e.target.value) as PrioriteTicket })}
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date prévue</label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ef7c21]"
                    value={form.scheduledAt ?? ''}
                    onChange={(e) => setForm({ ...form, scheduledAt: e.target.value || null })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Lieu"
                  value={form.location ?? ''}
                  onChange={(e) => setForm({ ...form, location: e.target.value || null })}
                  placeholder="Adresse ou site…"
                />
                <label className="flex items-center gap-3 pt-7">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-[#ef7c21] focus:ring-[#ef7c21]"
                    checked={form.isRemote}
                    onChange={(e) => setForm({ ...form, isRemote: e.target.checked })}
                  />
                  <span className="text-sm font-medium text-slate-700">Intervention à distance</span>
                </label>
              </div>

              <Input
                label="Ticket lié (optionnel)"
                type="number"
                value={form.ticketId ?? ''}
                onChange={(e) => setForm({ ...form, ticketId: e.target.value ? Number(e.target.value) : null })}
                placeholder="Identifiant du ticket"
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:border-[#ef7c21] transition-all min-h-[110px] font-medium resize-none"
                  placeholder="Détaillez l'intervention…"
                  value={form.description ?? ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </form>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-slate-100 shrink-0">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl px-6 h-11 font-bold">
            Annuler
          </Button>
          <Button
            type="submit"
            form="create-intervention-form"
            disabled={submitting}
            className="bg-[#ef7c21] hover:bg-orange-600 text-white rounded-xl px-8 h-11 font-black shadow-lg shadow-orange-100"
          >
            {submitting ? 'Création…' : 'Créer'}
          </Button>
        </div>
      </div>
    </div>
  );
}
