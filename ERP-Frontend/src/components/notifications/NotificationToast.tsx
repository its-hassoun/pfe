import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';

export function NotificationToast() {
  const navigate = useNavigate();
  const { toast, dismissToast, markRead } = useNotifications();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(dismissToast, 5000);
    return () => clearTimeout(t);
  }, [toast, dismissToast]);

  if (!toast) return null;

  const target = toast.ticketId
    ? `/tickets/${toast.ticketId}`
    : toast.interventionId
      ? `/interventions/${toast.interventionId}`
      : null;

  return (
    <div className="fixed top-20 right-6 z-[1000] w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-top-4 duration-200">
      <button
        onClick={dismissToast}
        className="absolute top-2 right-2 p-1 text-slate-300 hover:text-slate-500"
        aria-label="Fermer"
      >
        <X className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={async () => {
          if (!toast.isRead) await markRead(toast.id);
          dismissToast();
          if (target) navigate(target);
        }}
        className="text-left w-full p-4 flex gap-3 hover:bg-orange-50/40"
      >
        <div className="h-10 w-10 rounded-xl bg-[#ef7c21] text-white flex items-center justify-center shrink-0">
          <Bell className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900 truncate">{toast.title}</p>
          <p className="text-xs text-slate-500 line-clamp-2">{toast.message}</p>
        </div>
      </button>
    </div>
  );
}
