import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { agentService, type AgentDto, type AgentStats } from '../../../Services/helpdesk/agentService';
import { ChevronLeft, Loader2 } from 'lucide-react';

export function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<AgentDto | null>(null);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAll = () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    Promise.all([agentService.getById(Number(id)), agentService.stats(Number(id))])
      .then(([a, s]) => { setAgent(a); setStats(s); })
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
  if (error || !agent) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-slate-500 font-medium">Agent introuvable.</p>
        <Button variant="outline" onClick={() => navigate('/agents')}>Retour</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/agents')} className="flex items-center text-xs font-black uppercase tracking-widest text-slate-400 hover:text-[#ef7c21]">
        <ChevronLeft className="h-4 w-4 mr-1" /> Retour
      </button>

      <Card className="p-8 rounded-[2rem] shadow-sm">
        <div className="flex items-center gap-6">
          <Avatar initials={`${agent.prenom[0] ?? ''}${agent.nom[0] ?? ''}`} size="xl" color="bg-[#ef7c21]" />
          <div>
            <h2 className="text-2xl font-black text-slate-900">{agent.prenom} {agent.nom}</h2>
            <p className="text-sm text-slate-500">{agent.email}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
              {agent.role} • {agent.departement}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tickets assignés</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.assigned ?? 0}</p>
        </Card>
        <Card className="p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tickets résolus</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.resolved ?? 0}</p>
        </Card>
        <Card className="p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Interventions</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.interventions ?? 0}</p>
        </Card>
      </div>

      <Card className="p-6 rounded-[1.5rem] space-y-2 text-sm text-slate-700">
        <p><span className="font-bold">Poste :</span> {agent.poste}</p>
        <p><span className="font-bold">Téléphone :</span> {agent.telephone ?? '—'}</p>
        <p><span className="font-bold">Type :</span> {agent.agentType ?? '—'}</p>
        <p><span className="font-bold">Taux horaire :</span> {agent.coutHoraire ?? '—'}</p>
        <p><span className="font-bold">Note :</span> {agent.rating ?? '—'}</p>
      </Card>
    </div>
  );
}
