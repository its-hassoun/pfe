import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Pause, StopCircle, Play, MessageSquare, Send, X,
  Ban, UserPlus, Merge, ArrowRightLeft, Calendar, Check,
  Layers, FileText, Image as ImageIcon, Download, Paperclip,
  Loader2
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { ticketService } from '../../../Services/helpdesk/ticketService';
import type { User } from '../../../types';
import type { Ticket } from '../../../types/helpdesk';

interface TicketDetailProps {
  currentUser: User;
  onUpdateStatus: (id: string, status: any, userId?: string) => void;
}

export function TicketDetail({ currentUser, onUpdateStatus }: TicketDetailProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // ─── API STATES ────────────────────────────────────────────────────────────
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // ─── UI STATES ─────────────────────────────────────────────────────────────
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showResolution, setShowResolution] = useState(false);
  const [message, setMessage] = useState('');
  const [resolutionComment, setResolutionComment] = useState('');
  const [workDone, setWorkDone] = useState('');
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'agent', name: 'Agent Support', text: "Bonjour, j'ai bien reçu votre ticket. Je m'en occupe immédiatement.", time: '14:32' },
    { id: 2, sender: 'client', name: 'Client', text: "Merci, j'attends votre retour.", time: '14:35' }
  ]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // ─── FETCH DATA ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadTicket() {
      if (!id) return;
      try {
        setLoading(true);
        const data = await ticketService.getById(Number(id));
        setTicket(data);
        setError(false);
      } catch (err) {
        console.error("Failed to fetch ticket:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    loadTicket();
  }, [id]);

  // ─── LOGIC & ROLES ─────────────────────────────────────────────────────────
  const userRole = (currentUser.role || '').toLowerCase();
  const isStaff = userRole === 'admin' || userRole === 'agent';
  const isAdmin = userRole === 'admin';
  const isClient = !isStaff;

  // Mapping status based on your backend Enum (0: Nouveau, 1: En attente, etc.)
  const isFresh = ticket?.statut === 0; 
  const isPending = ticket?.statut === 1 || ticket?.statut === 3; // En attente ou Ouvert
  const isRejected = ticket?.statut === 2;
  const isClosed = ticket?.statut === 5;

  useEffect(() => {
    if (isPending && !isPaused && !showResolution && isStaff) {
      timerRef.current = setInterval(() => setSecondsElapsed((prev) => prev + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPending, isPaused, showResolution, isStaff]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatOpen]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s`;
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setChatMessages((prev) => [...prev, {
      id: Date.now(),
      sender: isClient ? 'client' : 'agent',
      name: isClient ? 'Client' : 'Agent Support',
      text: message.trim(),
      time
    }]);
    setMessage('');
  };

  // ─── RENDER STATES ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <Loader2 className="h-12 w-12 animate-spin text-[#ef7c21] mb-4" />
        <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Chargement du dossier...</p>
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

  const ResolutionModal = () => {
    if (!showResolution) return null;
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40">
        <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>📋</span> Résolution — #{ticket.id}
            </h3>
            <button onClick={() => setShowResolution(false)} className="p-1.5 hover:bg-slate-100 rounded-full">
              <X className="h-5 w-5 text-slate-400" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-orange-500" /> Date de fin
              </label>
              <input type="text" readOnly value={new Date().toLocaleDateString()} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-600" />
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-[10px] text-slate-400 font-medium">Ticket</p><p className="font-bold text-slate-700">#{ticket.id}</p></div>
              <div><p className="text-[10px] text-slate-400 font-medium">Client ID</p><p className="font-bold text-slate-700">{ticket.clientId}</p></div>
              <div className="col-span-2"><p className="text-[10px] text-slate-400 font-medium">Temps écoulé</p><p className="text-sm font-black text-orange-500">{formatTime(secondsElapsed)}</p></div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-500" /> Travail terminé <span className="text-red-500 font-medium">*</span>
              </label>
              <textarea
                required
                placeholder="Décrivez la solution..."
                className="w-full p-3 bg-white border-2 border-orange-200 rounded-xl text-sm min-h-[100px] focus:border-emerald-500 resize-none outline-none"
                value={workDone}
                onChange={(e) => setWorkDone(e.target.value)}
              />
            </div>

            <button
              disabled={!workDone.trim()}
              onClick={() => { onUpdateStatus(String(ticket.id), 'closed'); setShowResolution(false); }}
              className={`w-full py-4 rounded-xl font-black text-white flex items-center justify-center gap-2 transition-colors ${workDone.trim() ? 'bg-[#00B955] hover:bg-emerald-600' : 'bg-slate-200 cursor-not-allowed'}`}
            >
              <Send className="h-4 w-4" /> Envoyer la résolution
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-slate-50 p-4 md:p-8">
      <ResolutionModal />

      <div className={`transition-all duration-500 ${isChatOpen ? 'lg:pr-[450px]' : 'pr-0'} max-w-7xl mx-auto`}>
        <div className="max-w-4xl">
          <button onClick={() => navigate(-1)} className="flex items-center text-sm font-black text-slate-400 hover:text-[#ef7c21] mb-6 group">
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" /> RETOUR À LA LISTE
          </button>

          <Card className="overflow-hidden border-none shadow-2xl bg-white rounded-[2.5rem]">
            {/* Header section with dynamic color */}
            <div className={`p-8 text-white ${isRejected ? 'bg-slate-500' : isClosed ? 'bg-emerald-600' : 'bg-slate-900'}`}>
              <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest italic">Ticket #{ticket.id}</span>
                  </div>
                  <h1 className="text-3xl font-black tracking-tight">{ticket.titre}</h1>
                </div>

                <div className="flex flex-wrap gap-2">
                  {isFresh && isStaff && (
                    <div className="flex gap-3">
                      {isAdmin && (
                        <button onClick={() => onUpdateStatus(String(ticket.id), 'rejected')} className="bg-white/10 hover:bg-red-500 text-white border border-white/20 font-bold h-12 rounded-2xl px-6 flex items-center gap-2">
                          <Ban className="h-4 w-4" /> Refuser
                        </button>
                      )}
                      <button onClick={() => onUpdateStatus(String(ticket.id), 'pending', currentUser.id)} className="bg-emerald-500 hover:bg-emerald-400 text-white font-black h-12 rounded-2xl px-10 shadow-xl">ACCEPTER</button>
                    </div>
                  )}
                  {isPending && isStaff && (
                    <div className="flex gap-2">
                       <button className="flex items-center bg-purple-500 text-white px-5 py-2.5 rounded-full text-xs font-black shadow-lg"><ArrowRightLeft className="h-4 w-4 mr-2" /> TRANSFÉRER</button>
                    </div>
                  )}
                </div>
              </div>

              {isPending && isStaff && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 bg-black/20 p-6 rounded-[1.8rem] border border-white/10">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-black opacity-70 tracking-widest italic">Temps de mission</p>
                    <p className="text-3xl font-black font-mono tracking-tighter">{formatTime(secondsElapsed)}</p>
                  </div>
                  <div className="space-y-1 border-l border-white/10 pl-6">
                    <p className="text-[10px] uppercase font-black opacity-70 tracking-widest italic">Priorité ID</p>
                    <p className="text-xl font-bold text-red-100 uppercase">{ticket.priorite}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 md:p-12 space-y-12">
              {/* Ticket Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</p><p className="font-bold text-slate-800">{ticket.clientId}</p></div>
                <div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut</p><span className="font-black text-orange-600 uppercase">{ticket.statut}</span></div>
                <div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</p><p className="font-bold text-slate-700 italic">Support Technique</p></div>
                <div className="space-y-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Créé le</p><p className="font-bold text-slate-700">{new Date(ticket.dateCreation).toLocaleDateString()}</p></div>
              </div>

              {/* Description */}
              <div className="bg-slate-50 p-8 rounded-[2.5rem] border-l-8 border-[#ef7c21] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03]"><Layers size={120} /></div>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Description du problème</p>
                <p className="text-slate-700 leading-relaxed italic text-xl font-medium">"{ticket.description}"</p>
              </div>

              {/* Actions */}
              {isPending && isStaff && (
                <div className="flex gap-4 pt-8 border-t border-slate-100">
                  <button onClick={() => setIsPaused(!isPaused)} className={`flex-1 h-20 rounded-[2rem] font-black text-xl shadow-2xl flex items-center justify-center gap-4 ${isPaused ? 'bg-emerald-500' : 'bg-[#ef7c21]'} text-white`}>
                    {isPaused ? <Play fill="white" size={28} /> : <Pause fill="white" size={28} />} {isPaused ? 'REPRENDRE' : 'PAUSE MISSION'}
                  </button>
                  <button onClick={() => setShowResolution(true)} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black text-xl h-20 rounded-[2rem] shadow-2xl flex items-center justify-center gap-4">
                    <StopCircle fill="white" size={28} /> TERMINER TICKET
                  </button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Floating Chat Button and Sidebar */}
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
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex items-start gap-3 ${(isClient && msg.sender === 'client') || (isStaff && msg.sender === 'agent') ? 'flex-row-reverse' : ''}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 ${msg.sender === 'agent' ? 'bg-[#ef7c21]' : 'bg-slate-400'}`}>
                  {msg.name.charAt(0)}
                </div>
                <div className={`rounded-2xl p-4 shadow-sm max-w-[75%] ${(isClient && msg.sender === 'client') || (isStaff && msg.sender === 'agent') ? 'bg-[#ef7c21] text-white rounded-tr-none' : 'bg-white rounded-tl-none text-slate-600'}`}>
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
              placeholder="Écrire un message..."
              className="flex-1 px-4 py-3 bg-slate-50 rounded-2xl text-sm outline-none border border-transparent focus:border-orange-200"
            />
            <button onClick={handleSendMessage} className="h-11 w-11 bg-[#ef7c21] text-white rounded-2xl flex items-center justify-center"><Send className="h-4 w-4" /></button>
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