import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { notificationService } from '../Services/helpdesk/notificationService';
import { createNotificationHub, type NotificationHubClient } from '../Services/realtime/notificationHub';
import type { AppNotification } from '../types/notification';
import { useAuth } from './AuthContext';

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  toast: AppNotification | null;
  dismissToast: () => void;
  refresh: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<AppNotification | null>(null);
  const hubRef = useRef<NotificationHubClient | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const [list, count] = await Promise.all([
        notificationService.list({ take: 20 }),
        notificationService.unreadCount(),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    refresh();
  }, [isAuthenticated, refresh]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const hub = createNotificationHub();
    hubRef.current = hub;

    const unsubNew = hub.on<AppNotification>('notification:new', (n) => {
      setNotifications((prev) => [n, ...prev].slice(0, 50));
      setUnreadCount((c) => c + 1);
      setToast(n);
    });
    const unsubRead = hub.on<{ id: number }>('notification:read', ({ id }) => {
      setNotifications((prev) => prev.map((x) => (x.id === id ? { ...x, isRead: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
    });
    const unsubReadAll = hub.on('notification:read_all', () => {
      setNotifications((prev) => prev.map((x) => ({ ...x, isRead: true })));
      setUnreadCount(0);
    });

    hub.start();

    return () => {
      unsubNew();
      unsubRead();
      unsubReadAll();
      hub.stop();
      hubRef.current = null;
    };
  }, [isAuthenticated, user]);

  const markRead = async (id: number) => {
    await notificationService.markRead(id);
    setNotifications((prev) => prev.map((x) => (x.id === id ? { ...x, isRead: true } : x)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await notificationService.markAllRead();
    setNotifications((prev) => prev.map((x) => ({ ...x, isRead: true })));
    setUnreadCount(0);
  };

  const remove = async (id: number) => {
    await notificationService.delete(id);
    setNotifications((prev) => prev.filter((x) => x.id !== id));
    setUnreadCount((c) => {
      const removed = notifications.find((x) => x.id === id);
      return removed && !removed.isRead ? Math.max(0, c - 1) : c;
    });
  };

  const value = useMemo<NotificationContextValue>(() => ({
    notifications,
    unreadCount,
    loading,
    toast,
    dismissToast: () => setToast(null),
    refresh,
    markRead,
    markAllRead,
    remove,
  }), [notifications, unreadCount, loading, toast, refresh]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationProvider>');
  return ctx;
}
