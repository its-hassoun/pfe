import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ticketService } from '../../../Services/helpdesk/ticketService';
import { useAuth } from '../../../contexts/AuthContext';
import type { Ticket } from '../../../types/helpdesk';
import { Ticket as TicketIcon, Clock, CheckCircle, AlertCircle, Loader2, Plus } from 'lucide-react';

export function SubClientDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAll = () => {
    if (!user?.id) return;
    setLoading(true);
    setError(false);
    ticketService.getByClient(user.id)
      .then(setTickets)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(fetchAll, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#ef7c21]" />
        <span className="ml-3 text-slate-500 font-medium">Chargement…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-slate-500 font-medium">Impossible de charger.</p>
        <Button variant="outline" onClick={fetchAll}>Réessayer</Button>
      </div>
    );
  }

  const cards = [
    { label: 'Total', value: tickets.length, icon: TicketIcon, color: 'bg-blue-500' },
    { label: 'Open', value: tickets.filter((t) => t.statut === 0).length, icon: AlertCircle, color: 'bg-cyan-500' },
    { label: 'Pending', value: tickets.filter((t) => t.statut === 1 || t.statut === 3).length, icon: Clock, color: 'bg-amber-500' },
    { label: 'Resolved', value: tickets.filter((t) => t.statut === 5).length, icon: CheckCircle, color: 'bg-green-500' },
  ];

  const recent = [...tickets]
    .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-slate-900">My Dashboard</h2>
          <p className="text-sm text-slate-500">Welcome back, {user?.name ?? user?.email}</p>
        </div>
        <Button onClick={() => navigate('/create-ticket')}><Plus className="h-4 w-4 mr-2" /> Nouveau ticket</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((stat) => (
          <Card key={stat.label} className="flex items-center p-4">
            <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10 mr-4`}>
              <stat.icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden" noPadding>
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
          <h3 className="font-semibold text-slate-900">Mes tickets récents</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/my-tickets')}>Voir tout</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Sujet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {recent.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/tickets/${t.id}`)}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{t.titre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{t.statut}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(t.dateCreation).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-500">Aucun ticket.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
