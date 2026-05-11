import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, X, Inbox } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import type { AppNotification } from '../../types/notification';

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'à l\'instant';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return new Date(iso).toLocaleDateString('fr-FR');
}

function targetPath(n: AppNotification): string | null {
  if (n.ticketId) return `/tickets/${n.ticketId}`;
  if (n.interventionId) return `/interventions/${n.interventionId}`;
  return null;
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead, remove } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const handleItemClick = async (n: AppNotification) => {
    if (!n.isRead) await markRead(n.id);
    const p = targetPath(n);
    setOpen(false);
    if (p) navigate(p);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 max-h-[32rem] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div>
              <p className="text-sm font-bold text-slate-900">Notifications</p>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={markAllRead}
                disabled={unreadCount === 0}
                className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#ef7c21] hover:bg-orange-50 rounded-md disabled:opacity-30 flex items-center gap-1"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Tout lu
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <Inbox className="h-10 w-10 mb-2" />
                <p className="text-sm font-bold">Aucune notification</p>
              </div>
            )}
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleItemClick(n)}
                className={`group px-4 py-3 border-b border-slate-100 hover:bg-orange-50/40 cursor-pointer flex gap-3 ${
                  n.isRead ? 'bg-white' : 'bg-orange-50/30'
                }`}
              >
                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${n.isRead ? 'bg-slate-300' : 'bg-[#ef7c21]'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{n.title}</p>
                  <p className="text-xs text-slate-500 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                  {!n.isRead && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                      className="p-1 text-emerald-500 hover:bg-emerald-50 rounded"
                      title="Marquer comme lu"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); remove(n.id); }}
                    className="p-1 text-red-400 hover:bg-red-50 rounded"
                    title="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => { setOpen(false); navigate('/notifications'); }}
            className="px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-[#ef7c21] border-t border-slate-100 hover:bg-orange-50"
          >
            Voir toutes les notifications
          </button>
        </div>
      )}
    </div>
  );
}
