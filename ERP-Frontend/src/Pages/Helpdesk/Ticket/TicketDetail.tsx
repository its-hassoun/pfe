import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Pause, StopCircle, Play, MessageSquare, Send, X,
  Ban, ArrowRightLeft, Calendar, Check, Loader2, History,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { ticketService } from '../../../Services/helpdesk/ticketService';
import { ticketCommentService } from '../../../Services/helpdesk/ticketCommentService';
import { ticketHistoryService } from '../../../Services/helpdesk/ticketHistoryService';
import { agentService, type AgentDto } from '../../../Services/helpdesk/agentService';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotifications } from '../../../contexts/NotificationContext';
import type { MessageTicket, Ticket } from '../../../types/helpdesk';
import { PrioriteTicket, StatutTicket } from '../../../types/helpdesk';
import type { ActivityEvent } from '../../../types/dashboard';

const statutLabel: Record<number, string> = {
  0: 'Nouveau', 1: 'En attente', 2: 'Rejeté', 3: 'Ouvert', 4: 'En pause', 5: 'Clos', 6: 'Réservé',
};
const prioLabel: Record<number, string> = { 0: 'Basse', 1: 'Moyenne', 2: 'Haute', 3: 'Critique' };

export function TicketDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { refresh: refreshNotifications } = useNotifications();
  const role = (user?.role || '').toLowerCase();
  const isStaff = role === 'admin' || role === 'agent';
  const isAdmin = role === 'admin';
  const isClient = !isStaff;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<MessageTicket[]>([]);
  const [history, setHistory] = useState<ActivityEvent[]>([]);
  const [agents, setAgents] = useState<AgentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showResolution, setShowResolution] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferAgent, setTransferAgent] = useState('');
  const [resolutionComment, setResolutionComment] = useState('');
  const [workDone, setWorkDone] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const fetchAll = () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    const ticketId = Number(id);
    Promise.all([
      ticketService.getById(ticketId),
      ticketCommentService.list(ticketId).catch(() => [] as MessageTicket[]),
      ticketHistoryService.get(ticketId).catch(() => [] as ActivityEvent[]),
      isStaff ? agentService.list().catch(() => []) : Promise.resolve([] as AgentDto[]),
    ])
      .then(([t, c, h, a]) => {
        setTicket(t); setComments(c); setHistory(h); setAgents(a);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(fetchAll, [id]);

  const isFresh = ticket?.statut === StatutTicket.Nouveau;
  const isPending = ticket?.statut === StatutTicket.EnAttente || ticket?.statut === StatutTicket.Ouvert;
  const isRejected = ticket?.statut === StatutTicket.Rejete;
  const isClosed = ticket?.statut === StatutTicket.Clos;

  useEffect(() => {
    if (isPending && !isPaused && !showResolution && isStaff) {
      timerRef.current = setInterval(() => setSecondsElapsed((p) => p + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPending, isPaused, showResolution, isStaff]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments, isChatOpen]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s`;
  };

  const handleStatusChange = async (status: StatutTicket) => {
    if (!ticket) return;
    await ticketService.changeStatus(ticket.id, status);
    fetchAll();
    refreshNotifications();
  };

  const handleSendComment = async () => {
    if (!ticket || !chatInput.trim()) return;
    const created = await ticketCommentService.add(ticket.id, chatInput.trim());
    setComments((prev) => [...prev, created]);
    setChatInput('');
  };

  const handleTransfer = async () => {
    if (!ticket || !transferAgent) return;
    await ticketService.transfer(ticket.id, transferAgent);
    setShowTransfer(false);
    setTransferAgent('');
    fetchAll();
  };

  const handleResolution = async () => {
    if (!ticket || !workDone.trim()) return;
    if (resolutionComment.trim()) {
      await ticketCommentService.add(ticket.id, `Résolution: ${workDone.trim()}\n${resolutionComment.trim()}`);
    } else {
      await ticketCommentService.add(ticket.id, `Résolution: ${workDone.trim()}`);
    }
    await ticketService.changeStatus(ticket.id, StatutTicket.Clos);
    setShowResolution(false);
    fetchAll();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <Loader2 className="h-12 w-12 animate-spin text-[#ef7c21] mb-4" />
        <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Chargement du dossier…</p>
      </div>
    );
  }
  if (error || !ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 gap-4">
        <Ban className="h-12 w-12 text-slate-300" />
        <p className="text-slate-500 font-bold uppercase">Ticket introuvable</p>
        <button onClick={() => navigate('/tickets')} className="text-[#ef7c21] font-black underline">RETOUR À LA LISTE</button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50 p-4 md:p-8">
      {showResolution && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Résolution — #{ticket.id}</h3>
              <button onClick={() => setShowResolution(false)} className="p-1.5 hover:bg-slate-100 rounded-full">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-[10px] text-slate-400 font-medium">Ticket</p><p className="font-bold text-slate-700">#{ticket.id}</p></div>
                <div><p className="text-[10px] text-slate-400 font-medium">Temps écoulé</p><p className="text-sm font-black text-orange-500">{formatTime(secondsElapsed)}</p></div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-500" /> Travail terminé <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  placeholder="Décrivez la solution…"
                  className="w-full p-3 bg-white border-2 border-orange-200 rounded-xl text-sm min-h-[100px] focus:border-emerald-500 resize-none outline-none"
                  value={workDone}
                  onChange={(e) => setWorkDone(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Notes additionnelles</label>
                <textarea
                  className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm min-h-[60px] resize-none outline-none"
                  value={resolutionComment}
                  onChange={(e) => setResolutionComment(e.target.value)}
                />
              </div>
              <button
                disabled={!workDone.trim()}
                onClick={handleResolution}
                className={`w-full py-4 rounded-xl font-black text-white flex items-center justify-center gap-2 ${
                  workDone.trim() ? 'bg-[#00B955] hover:bg-emerald-600' : 'bg-slate-200 cursor-not-allowed'
                }`}
              >
                <Send className="h-4 w-4" /> Clôturer le ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {showTransfer && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Transférer le ticket</h3>
              <button onClick={() => setShowTransfer(false)} className="p-1.5 hover:bg-slate-100 rounded-full">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <Select
                label="Nouvel agent"
                options={[
                  { value: '', label: 'Sélectionner…' },
                  ...agents.map((a) => ({ value: String(a.id), label: `${a.prenom} ${a.nom}`.trim() })),
                ]}
                value={transferAgent}
                onChange={(e) => setTransferAgent(e.target.value)}
              />
              <Button onClick={handleTransfer} disabled={!transferAgent} className="w-full bg-[#ef7c21] hover:bg-orange-600 text-white">
                <ArrowRightLeft className="h-4 w-4 mr-2" /> Transférer
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className={`transition-all duration-500 ${isChatOpen ? 'lg:pr-[450px]' : 'pr-0'} max-w-7xl mx-auto`}>
        <div className="max-w-4xl">
          <button onClick={() => navigate(-1)} className="flex items-center text-sm font-black text-slate-400 hover:text-[#ef7c21] mb-6 group">
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" /> RETOUR À LA LISTE
          </button>

          <Card className="overflow-hidden border-none shadow-2xl bg-white rounded-[2.5rem]" noPadding>
            <div className={`p-8 text-white ${isRejected ? 'bg-slate-500' : isClosed ? 'bg-emerald-600' : 'bg-slate-900'}`}>
              <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest italic">Ticket #{ticket.id}</span>
                    <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase">{statutLabel[ticket.statut]}</span>
                  </div>
                  <h1 className="text-3xl font-black tracking-tight">{ticket.titre}</h1>
                </div>
                <div className="flex flex-wrap gap-2">
                  {isFresh && isStaff && (
                    <div className="flex gap-3">
                      {isAdmin && (
                        <button onClick={() => handleStatusChange(StatutTicket.Rejete)} className="bg-white/10 hover:bg-red-500 text-white border border-white/20 font-bold h-12 rounded-2xl px-6 flex items-center gap-2">
                          <Ban className="h-4 w-4" /> Refuser
                        </button>
                      )}
                      <button onClick={() => handleStatusChange(StatutTicket.EnAttente)} className="bg-emerald-500 hover:bg-emerald-400 text-white font-black h-12 rounded-2xl px-10 shadow-xl">
                        ACCEPTER
                      </button>
                    </div>
                  )}
                  {isPending && isStaff && (
                    <button onClick={() => setShowTransfer(true)} className="flex items-center bg-purple-500 text-white px-5 py-2.5 rounded-full text-xs font-black shadow-lg">
                      <ArrowRightLeft className="h-4 w-4 mr-2" /> TRANSFÉRER
                    </button>
                  )}
                </div>
              </div>

              {isPending && isStaff && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 bg-black/20 p-6 rounded-[1.8rem] border border-white/10">
                  <div>
                    <p className="text-[10px] uppercase font-black opacity-70 tracking-widest italic">Temps de mission</p>
                    <p className="text-3xl font-black font-mono tracking-tighter">{formatTime(secondsElapsed)}</p>
                  </div>
                  <div className="border-l border-white/10 pl-6">
                    <p className="text-[10px] uppercase font-black opacity-70 tracking-widest italic">Priorité</p>
                    <p className="text-xl font-bold text-red-100 uppercase">{prioLabel[ticket.priorite]}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 md:p-12 space-y-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div><p className="text-[10px] font-black text-slate-400 uppercase">Client</p><p className="font-bold text-slate-800">{ticket.clientId}</p></div>
                <div><p className="text-[10px] font-black text-slate-400 uppercase">Agent</p><p className="font-bold text-slate-700">{ticket.agentPrincipalId ?? '—'}</p></div>
                <div><p className="text-[10px] font-black text-slate-400 uppercase">Priorité</p><p className="font-bold text-slate-700">{prioLabel[ticket.priorite]}</p></div>
                <div><p className="text-[10px] font-black text-slate-400 uppercase">Créé le</p><p className="font-bold text-slate-700">{new Date(ticket.dateCreation).toLocaleDateString('fr-FR')}</p></div>
              </div>

              <div className="bg-slate-50 p-8 rounded-[2.5rem] border-l-8 border-[#ef7c21]">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Description</p>
                <p className="text-slate-700 leading-relaxed italic text-xl font-medium">"{ticket.description}"</p>
              </div>

              {isPending && isStaff && (
                <div className="flex gap-4 pt-8 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setIsPaused(!isPaused);
                      handleStatusChange(isPaused ? StatutTicket.Ouvert : StatutTicket.EnPause);
                    }}
                    className={`flex-1 h-20 rounded-[2rem] font-black text-xl shadow-2xl flex items-center justify-center gap-4 ${isPaused ? 'bg-emerald-500' : 'bg-[#ef7c21]'} text-white`}
                  >
                    {isPaused ? <Play fill="white" size={28} /> : <Pause fill="white" size={28} />} {isPaused ? 'REPRENDRE' : 'PAUSE'}
                  </button>
                  <button
                    onClick={() => setShowResolution(true)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black text-xl h-20 rounded-[2rem] shadow-2xl flex items-center justify-center gap-4"
                  >
                    <StopCircle fill="white" size={28} /> TERMINER
                  </button>
                </div>
              )}

              {history.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <History className="h-3.5 w-3.5" /> Historique
                  </p>
                  <ul className="space-y-2">
                    {history.slice(0, 8).map((h) => (
                      <li key={h.id} className="px-4 py-2 rounded-xl bg-slate-50 text-xs text-slate-600 flex justify-between">
                        <span><span className="font-bold">{h.actorUserId}</span> — Action {h.action} {h.fromValue && `(${h.fromValue} → ${h.toValue})`}</span>
                        <span className="text-slate-400">{new Date(h.createdAt).toLocaleString('fr-FR')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {isChatOpen && (
        <div className="fixed top-0 right-0 h-full w-full md:w-[430px] z-[200] bg-white shadow-2xl flex flex-col border-l border-slate-100">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-[#ef7c21]" />
              <span className="font-black text-sm uppercase tracking-widest">Discussion — Ticket #{ticket.id}</span>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="h-5 w-5" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
            {comments.length === 0 && (
              <p className="text-center text-sm text-slate-400 mt-10">Aucun message pour l'instant.</p>
            )}
            {comments.map((m) => {
              const fromMe = m.envoyeParId === user?.id;
              return (
                <div key={m.id} className={`flex items-start gap-3 ${fromMe ? 'flex-row-reverse' : ''}`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 ${fromMe ? 'bg-[#ef7c21]' : 'bg-slate-400'}`}>
                    {m.envoyeParId.slice(0, 1).toUpperCase()}
                  </div>
                  <div className={`rounded-2xl p-4 shadow-sm max-w-[75%] ${fromMe ? 'bg-[#ef7c21] text-white rounded-tr-none' : 'bg-white rounded-tl-none text-slate-600'}`}>
                    <p className="text-sm whitespace-pre-wrap">{m.contenu}</p>
                    <p className={`text-[10px] mt-1 ${fromMe ? 'opacity-70' : 'text-slate-400'}`}>
                      {new Date(m.dateEnvoi).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-3">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendComment(); }}
              placeholder="Écrire un message…"
              className="flex-1 px-4 py-3 bg-slate-50 rounded-2xl text-sm outline-none border border-transparent focus:border-orange-200"
            />
            <button onClick={handleSendComment} className="h-11 w-11 bg-[#ef7c21] text-white rounded-2xl flex items-center justify-center">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="fixed bottom-10 right-10 z-[100]">
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`h-20 w-20 rounded-[2.2rem] flex items-center justify-center shadow-2xl transition-all ${isChatOpen ? 'bg-slate-900' : 'bg-[#ef7c21] hover:scale-110'}`}
        >
          {isChatOpen ? <X className="text-white h-10 w-10" /> : <MessageSquare className="text-white h-10 w-10 fill-current" />}
        </button>
      </div>
    </div>
  );
}
