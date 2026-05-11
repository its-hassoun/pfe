import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './Pages/LoginPage';
import { Dashboard } from './Pages/Dashboard';
import { TicketsList } from './Pages/Helpdesk/Ticket/TicketsList';
import { TicketDetail } from './Pages/Helpdesk/Ticket/TicketDetail';
import { CreateTicket } from './Pages/Helpdesk/Ticket/CreateTicket';
import { Timesheets } from './Pages/Timesheets/Timesheets';
import { TimesheetValidation } from './Pages/Timesheets/TimesheetValidation';
import { AllAgents } from './Pages/Helpdesk/Ticket/AllAgents';
import { AllClients } from './Pages/Helpdesk/Ticket/AllClients';
import { AgentDetail } from './Pages/Helpdesk/Ticket/AgentDetail';
import { ClientDetail } from './Pages/Helpdesk/Ticket/ClientDetail';
import { Knowledge } from './Pages/Helpdesk/Knowledge/Knowledge';
import { ClientDashboard } from './Pages/Helpdesk/Ticket/ClientDashboard';
import { SubClientDashboard } from './Pages/Helpdesk/Ticket/SubClientDashboard';
import { InterventionsList } from './Pages/Helpdesk/Intervention/InterventionsList';
import { InterventionDetail } from './Pages/Helpdesk/Intervention/InterventionDetail';
import { NotificationsPage } from './Pages/Notifications';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { RequireAuth } from './components/auth/RequireAuth';
import type { Timesheet, TimesheetTask, Project } from './types';

function getPageTitle(pathname: string) {
  if (pathname === '/dashboard') return 'Dashboard';
  if (pathname === '/tickets') return 'All Tickets';
  if (pathname === '/my-tickets') return 'My Tickets';
  if (pathname.startsWith('/tickets/')) return 'Ticket Details';
  if (pathname === '/create-ticket') return 'Create Ticket';
  if (pathname === '/timesheets') return 'My Timesheet';
  if (pathname === '/validation') return 'Timesheet Validation';
  if (pathname === '/agents') return 'All Agents';
  if (pathname.startsWith('/agents/')) return 'Agent Details';
  if (pathname === '/clients') return 'All Clients';
  if (pathname.startsWith('/clients/')) return 'Client Details';
  if (pathname === '/knowledge') return 'Knowledge Base';
  if (pathname === '/company') return 'Company Overview';
  if (pathname === '/my-dashboard') return 'My Dashboard';
  if (pathname === '/interventions') return 'Interventions';
  if (pathname.startsWith('/interventions/')) return 'Intervention Details';
  if (pathname === '/notifications') return 'Notifications';
  return 'HelpDesk Pro';
}

function getDefaultRoute(role?: string) {
  switch (role) {
    case 'Client': return '/company';
    case 'SubClient': return '/my-dashboard';
    case 'Admin':
    case 'Agent':
    default: return '/dashboard';
  }
}

function LayoutWithTitle({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return <AppLayout title={getPageTitle(location.pathname)}>{children}</AppLayout>;
}

function AppRoutes() {
  const { user } = useAuth();

  // Local-only timesheet state preserved (timesheet backend is a separate module out of scope).
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [projects] = useState<Project[]>([]);

  const handleSaveTask = (task: TimesheetTask) => {
    if (!user) return;
    setTimesheets((prev) => {
      const existing = prev.find((t) => t.userId === user.id);
      if (existing) {
        return prev.map((t) =>
          t.userId === user.id
            ? { ...t, tasks: [...t.tasks, task], totalHours: t.totalHours + task.hours }
            : t
        );
      }
      return [
        ...prev,
        {
          id: `ts-${Date.now()}`,
          userId: user.id,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          tasks: [task],
          status: 'draft',
          totalHours: task.hours,
        },
      ];
    });
  };
  const handleDeleteTask = (taskId: string) => {
    if (!user) return;
    setTimesheets((prev) =>
      prev.map((t) => {
        if (t.userId !== user.id) return t;
        const removed = t.tasks.find((x) => x.id === taskId);
        return {
          ...t,
          tasks: t.tasks.filter((x) => x.id !== taskId),
          totalHours: t.totalHours - (removed?.hours ?? 0),
        };
      })
    );
  };
  const handleSubmitTimesheet = () => {
    if (!user) return;
    setTimesheets((prev) => prev.map((t) => (t.userId === user.id && t.status === 'draft' ? { ...t, status: 'submitted' } : t)));
  };
  const handleValidate = (id: string) =>
    setTimesheets((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'validated', validatedBy: user?.id } : t)));
  const handleReject = (id: string) =>
    setTimesheets((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'rejected' } : t)));

  const legacyUser = user
    ? {
        id: user.id,
        name: user.name ?? user.email,
        email: user.email,
        team: '',
        role: (user.role.toLowerCase() === 'admin' ? 'Admin' : user.role.toLowerCase()) as
          | 'Admin' | 'agent' | 'manager' | 'client' | 'subclient',
        avatarInitials: user.avatarInitials ?? user.email.slice(0, 2).toUpperCase(),
        avatarColor: 'bg-[#ef7c21]',
      }
    : null;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <LayoutWithTitle>
              <Routes>
                <Route path="/" element={<Navigate to={getDefaultRoute(user?.role)} replace />} />
                <Route path="/dashboard" element={<RequireAuth roles={['Admin', 'Agent']}><Dashboard /></RequireAuth>} />
                <Route path="/tickets" element={user && <TicketsList currentUser={user} mode="all" />} />
                <Route path="/my-tickets" element={user && <TicketsList currentUser={user} mode="my-tickets" />} />
                <Route path="/tickets/:id" element={<TicketDetail />} />
                <Route path="/create-ticket" element={<CreateTicket />} />
                <Route path="/company" element={<RequireAuth roles={['Client']}><ClientDashboard /></RequireAuth>} />
                <Route path="/my-dashboard" element={<RequireAuth roles={['SubClient']}><SubClientDashboard /></RequireAuth>} />
                <Route path="/company-tickets" element={user && <TicketsList currentUser={user} mode="all" />} />
                <Route path="/interventions" element={<InterventionsList />} />
                <Route path="/interventions/:id" element={<InterventionDetail />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route
                  path="/timesheets"
                  element={
                    legacyUser ? (
                      <Timesheets
                        currentUser={legacyUser}
                        timesheet={timesheets.find((t) => t.userId === legacyUser.id)}
                        projects={projects}
                        onSaveTask={handleSaveTask}
                        onDeleteTask={handleDeleteTask}
                        onSubmitTimesheet={handleSubmitTimesheet}
                      />
                    ) : null
                  }
                />
                <Route
                  path="/validation"
                  element={
                    <RequireAuth roles={['Admin']}>
                      <TimesheetValidation
                        timesheets={timesheets}
                        users={legacyUser ? [legacyUser] : []}
                        onValidate={handleValidate}
                        onReject={handleReject}
                      />
                    </RequireAuth>
                  }
                />
                <Route path="/agents" element={<RequireAuth roles={['Admin']}><AllAgents /></RequireAuth>} />
                <Route path="/agents/:id" element={<RequireAuth roles={['Admin']}><AgentDetail /></RequireAuth>} />
                <Route path="/clients" element={<RequireAuth roles={['Admin']}><AllClients /></RequireAuth>} />
                <Route path="/clients/:id" element={<RequireAuth roles={['Admin']}><ClientDetail /></RequireAuth>} />
                <Route path="/knowledge" element={<RequireAuth roles={['Admin', 'Agent']}><Knowledge /></RequireAuth>} />
                <Route path="*" element={<Navigate to={getDefaultRoute(user?.role)} replace />} />
              </Routes>
            </LayoutWithTitle>
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}
