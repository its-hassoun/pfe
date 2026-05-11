import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Check, Trash2, Inbox } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { notificationService } from '../Services/helpdesk/notificationService';
import { useNotifications } from '../contexts/NotificationContext';
import type { AppNotification } from '../types/notification';

export function NotificationsPage() {
  const navigate = useNavigate();
  const { markAllRead, markRead, remove } = useNotifications();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchAll = () => {
    setLoading(true);
    setError(false);
    notificationService
      .list({ unreadOnly: filter === 'unread', take: 100 })
      .then(setItems)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(fetchAll, [filter]);

  const handleClick = async (n: AppNotification) => {
    if (!n.isRead) {
      await markRead(n.id);
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    }
    if (n.ticketId) navigate(`/tickets/${n.ticketId}`);
    else if (n.interventionId) navigate(`/interventions/${n.interventionId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Notifications</h2>
          <p className="text-sm text-slate-500">Vos alertes et mises à jour</p>
        </div>
        <Button variant="outline" onClick={async () => { await markAllRead(); fetchAll(); }}>
          <CheckCheck className="h-4 w-4 mr-2" /> Tout marquer comme lu
        </Button>
      </div>

      <Card noPadding className="overflow-hidden">
        <div className="flex border-b border-slate-200 px-4 bg-slate-50">
          {[
            { v: 'all', l: 'Toutes' },
            { v: 'unread', l: 'Non lues' },
          ].map((t) => (
            <button
              key={t.v}
              onClick={() => setFilter(t.v as 'all' | 'unread')}
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                filter === t.v ? 'border-[#ef7c21] text-[#ef7c21]' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500">Chargement…</div>
        ) : error ? (
          <div className="py-12 text-center text-red-500">
            <p>Impossible de charger les notifications.</p>
            <Button variant="outline" className="mt-3" onClick={fetchAll}>Réessayer</Button>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Inbox className="h-10 w-10 mx-auto mb-2" />
            <p className="font-bold">Aucune notification</p>
          </div>
        ) : (
          <ul>
            {items.map((n) => (
              <li
                key={n.id}
                className={`px-6 py-4 border-b border-slate-100 flex items-start gap-3 hover:bg-slate-50 cursor-pointer ${
                  n.isRead ? '' : 'bg-orange-50/30'
                }`}
                onClick={() => handleClick(n)}
              >
                <div className="h-10 w-10 rounded-xl bg-orange-50 text-[#ef7c21] flex items-center justify-center shrink-0">
                  <Bell className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900">{n.title}</p>
                  <p className="text-xs text-slate-500">{n.message}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                    {new Date(n.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {!n.isRead && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markRead(n.id); setItems((p) => p.map((x) => x.id === n.id ? { ...x, isRead: true } : x)); }}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); remove(n.id); setItems((p) => p.filter((x) => x.id !== n.id)); }}
                    className="p-1.5 text-red-400 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
