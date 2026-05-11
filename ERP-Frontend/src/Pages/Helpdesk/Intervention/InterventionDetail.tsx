import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  Ban,
  Wrench,
  Calendar,
  Play,
  StopCircle,
  XCircle,
  UserCheck,
  MapPin,
  FileText,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { interventionExecutionService } from '../../../Services/helpdesk/interventionExecutionService';
import { agentService, type AgentDto } from '../../../Services/helpdesk/agentService';
import {
  InterventionStatut,
  InterventionStatutLabel,
  type InterventionExecution,
} from '../../../types/interventionExecution';
import { InterventionReportModal } from './InterventionReportModal';
import { useAuth } from '../../../contexts/AuthContext';

function statusBadgeClasses(s: InterventionStatut) {
  switch (s) {
    case InterventionStatut.Pending: return 'bg-amber-100 text-amber-700';
    case InterventionStatut.Scheduled: return 'bg-blue-100 text-blue-700';
    case InterventionStatut.InProgress: return 'bg-emerald-100 text-emerald-700';
    case InterventionStatut.Completed: return 'bg-slate-200 text-slate-700';
    case InterventionStatut.Cancelled: return 'bg-red-100 text-red-700';
  }
}

export function InterventionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isStaff = user?.role === 'Admin' || user?.role === 'Agent';

  const [data, setData] = useState<InterventionExecution | null>(null);
  const [agents, setAgents] = useState<AgentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [agentId, setAgentId] = useState<string>('');

  const fetchAll = () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    Promise.all([
      interventionExecutionService.getById(Number(id)),
      agentService.list().catch(() => []),
    ])
      .then(([d, a]) => {
        setData(d);
        setAgents(a);
        setAgentId(d.assignedAgentId ?? '');
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(fetchAll, [id]);

  const changeStatus = async (status: InterventionStatut) => {
    if (!data) return;
    await interventionExecutionService.changeStatus(data.id, status);
    fetchAll();
  };

  const assign = async () => {
    if (!data || !agentId) return;
    await interventionExecutionService.assign(data.id, agentId);
    fetchAll();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#ef7c21]" />
        <span className="ml-3 text-slate-500 font-medium">Chargement…</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Ban className="h-12 w-12 text-slate-300" />
        <p className="text-slate-500 font-bold uppercase">Intervention introuvable</p>
        <button onClick={() => navigate('/interventions')} className="text-[#ef7c21] font-black underline">
          Retour à la liste
        </button>
      </div>
    );
  }

  return (
    <>
      <InterventionReportModal
        interventionId={data.id}
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        onDone={fetchAll}
      />

      <div className="space-y-6">
        <button
          onClick={() => navigate('/interventions')}
          className="flex items-center text-sm font-black text-slate-400 hover:text-[#ef7c21] group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" /> RETOUR À LA LISTE
        </button>

        <Card className="overflow-hidden border-none shadow-2xl bg-white rounded-[2.5rem]" noPadding>
          <div className={`p-8 text-white ${
            data.statut === InterventionStatut.Completed ? 'bg-emerald-600' :
            data.statut === InterventionStatut.Cancelled ? 'bg-slate-500' :
            'bg-slate-900'
          }`}>
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest italic">
                    Intervention #{data.id}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusBadgeClasses(data.statut)}`}>
                    {InterventionStatutLabel[data.statut]}
                  </span>
                </div>
                <h1 className="text-3xl font-black tracking-tight">{data.titre}</h1>
                {data.description && <p className="text-white/80 max-w-2xl">{data.description}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 bg-black/20 p-6 rounded-[1.8rem] border border-white/10">
              <div>
                <p className="text-[10px] uppercase font-black opacity-70 tracking-widest italic">Client</p>
                <p className="font-bold">{data.clientId}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-black opacity-70 tracking-widest italic">Agent</p>
                <p className="font-bold">{data.assignedAgentId ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-black opacity-70 tracking-widest italic">Date prévue</p>
                <p className="font-bold">{data.scheduledAt ? new Date(data.scheduledAt).toLocaleString('fr-FR') : '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-black opacity-70 tracking-widest italic">Mode</p>
                <p className="font-bold">{data.isRemote ? 'À distance' : data.location || 'Sur site'}</p>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-slate-50 p-6 rounded-2xl border-l-4 border-[#ef7c21]">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Détails</p>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-center gap-2"><Wrench className="h-4 w-4 text-[#ef7c21]" /> Catégorie : <span className="font-bold ml-1">{data.categorie}</span></li>
                  <li className="flex items-center gap-2"><Calendar className="h-4 w-4 text-[#ef7c21]" /> Créée le {new Date(data.createdAt).toLocaleString('fr-FR')}</li>
                  {data.location && <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#ef7c21]" /> {data.location}</li>}
                  {data.ticketId && <li className="flex items-center gap-2"><FileText className="h-4 w-4 text-[#ef7c21]" />Ticket lié : <button className="text-[#ef7c21] font-bold underline ml-1" onClick={() => navigate(`/tickets/${data.ticketId}`)}>#{data.ticketId}</button></li>}
                </ul>
              </div>

              {data.rapportResolution && (
                <div className="bg-emerald-50 p-6 rounded-2xl border-l-4 border-emerald-500">
                  <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2">Rapport de résolution</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{data.rapportResolution}</p>
                </div>
              )}
            </div>

            {isStaff && (
              <div className="space-y-4">
                <div className="p-5 bg-slate-50 rounded-2xl space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigner un agent</p>
                  <Select
                    options={[
                      { value: '', label: 'Non assigné' },
                      ...agents.map((a) => ({ value: String(a.id), label: `${a.prenom} ${a.nom}`.trim() })),
                    ]}
                    value={agentId}
                    onChange={(e) => setAgentId(e.target.value)}
                  />
                  <Button onClick={assign} className="w-full"><UserCheck className="h-4 w-4 mr-2" /> Mettre à jour</Button>
                </div>

                <div className="p-5 bg-slate-50 rounded-2xl space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut</p>
                  {data.statut !== InterventionStatut.InProgress && data.statut !== InterventionStatut.Completed && (
                    <Button onClick={() => changeStatus(InterventionStatut.InProgress)} className="w-full bg-blue-600 text-white hover:bg-blue-700">
                      <Play className="h-4 w-4 mr-2" /> Démarrer
                    </Button>
                  )}
                  {data.statut !== InterventionStatut.Completed && (
                    <Button onClick={() => setReportOpen(true)} className="w-full bg-emerald-600 text-white hover:bg-emerald-500">
                      <StopCircle className="h-4 w-4 mr-2" /> Clôturer avec rapport
                    </Button>
                  )}
                  {data.statut !== InterventionStatut.Cancelled && data.statut !== InterventionStatut.Completed && (
                    <Button onClick={() => changeStatus(InterventionStatut.Cancelled)} variant="outline" className="w-full">
                      <XCircle className="h-4 w-4 mr-2" /> Annuler
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
