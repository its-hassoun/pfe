import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  CheckSquare,
  LogOut,
  LifeBuoy,
  ClipboardList,
  Building,
  Users,
  Calendar,
  BookOpen,
  Wrench,
  BellRing
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import type { AuthUser, Role } from '../../types/auth';

interface SidebarProps {
  currentUser: AuthUser;
  isMobileOpen?: boolean;
  onLogout?: () => void;
}

const ROLE_ALIASES: Record<string, Role> = {
  admin: 'Admin',
  agent: 'Agent',
  client: 'Client',
  subclient: 'SubClient',
};

function normalizeRole(r: string): Role {
  return ROLE_ALIASES[r.toLowerCase()] ?? (r as Role);
}

export function Sidebar({
  currentUser,
  isMobileOpen = false,
  onLogout
}: SidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  const role = normalizeRole(currentUser.role);

  const allNavItems = [
    { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'HELPDESK', roles: ['Agent', 'Admin'] as Role[] },
    { id: 'tickets', path: '/tickets', label: 'All Tickets', icon: Ticket, section: 'HELPDESK', roles: ['Agent', 'Admin'] as Role[] },
    { id: 'my-tickets', path: '/my-tickets', label: 'My Tickets', icon: ClipboardList, section: 'HELPDESK', roles: ['Agent'] as Role[] },
    { id: 'interventions', path: '/interventions', label: 'Interventions', icon: Wrench, section: 'HELPDESK', roles: ['Agent', 'Admin', 'Client', 'SubClient'] as Role[] },
    { id: 'knowledge', path: '/knowledge', label: 'Knowledge Base', icon: BookOpen, section: 'HELPDESK', roles: ['Agent', 'Admin'] as Role[] },
    { id: 'create-ticket', path: '/create-ticket', label: 'Create Ticket', icon: PlusCircle, section: 'HELPDESK', roles: ['Agent', 'Admin', 'SubClient'] as Role[] },
    { id: 'notifications', path: '/notifications', label: 'Notifications', icon: BellRing, section: 'HELPDESK', roles: ['Agent', 'Admin', 'Client', 'SubClient'] as Role[] },
    { id: 'timesheets', path: '/timesheets', label: 'Timesheet and Calendar', icon: Calendar, section: 'TIMESHEETS', roles: ['Agent', 'Admin'] as Role[] },
    { id: 'validation', path: '/validation', label: 'Validation', icon: CheckSquare, section: 'TIMESHEETS', roles: ['Admin'] as Role[] },
    { id: 'all-clients', path: '/clients', label: 'All Clients', icon: Building, section: 'ADMIN', roles: ['Admin'] as Role[] },
    { id: 'all-agents', path: '/agents', label: 'All Agents', icon: Users, section: 'ADMIN', roles: ['Admin'] as Role[] },
    { id: 'client-dashboard', path: '/company', label: 'Company Overview', icon: Building, section: 'CLIENT', roles: ['Client'] as Role[] },
    { id: 'client-tickets', path: '/company-tickets', label: 'All Tickets', icon: Ticket, section: 'CLIENT', roles: ['Client'] as Role[] },
    { id: 'subclient-dashboard', path: '/my-dashboard', label: 'My Dashboard', icon: LayoutDashboard, section: 'SUBCLIENT', roles: ['SubClient'] as Role[] },
    { id: 'subclient-my-tickets', path: '/my-tickets', label: 'My Tickets', icon: Ticket, section: 'SUBCLIENT', roles: ['SubClient'] as Role[] },
  ];

  const navItems = allNavItems.filter((item) => item.roles.includes(role));

  const renderNavItem = (item: (typeof navItems)[0]) => {
    const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
    return (
      <Link
        key={item.id}
        to={item.path}
        className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors border-l-4 ${
          isActive
            ? 'bg-orange-50 border-[#ef7c21] text-[#ef7c21]'
            : 'border-transparent text-slate-600 hover:text-[#ef7c21] hover:bg-orange-50'
        }`}
      >
        <item.icon
          className={`h-5 w-5 mr-3 ${isActive ? 'text-[#ef7c21]' : 'text-slate-400'}`}
        />
        {item.label}
      </Link>
    );
  };

  const sections: { key: string; label: string }[] = [
    { key: 'HELPDESK', label: 'Helpdesk' },
    { key: 'TIMESHEETS', label: 'Timesheets' },
    { key: 'ADMIN', label: 'Administration' },
    { key: 'CLIENT', label: 'Company' },
    { key: 'SUBCLIENT', label: 'Support' },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-white text-slate-900 transform transition-transform duration-300 ease-in-out shadow-lg ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      } md:relative md:translate-x-0 flex flex-col`}
    >
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <div className="p-1.5 rounded-md mr-3" style={{ backgroundColor: '#ef7c21' }}>
          <LifeBuoy className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-slate-900">
          HelpDesk Pro
        </span>
      </div>

      <nav className="flex-1 py-6 overflow-y-auto">
        {sections.map((s) => {
          const items = navItems.filter((i) => i.section === s.key);
          if (items.length === 0) return null;
          return (
            <div key={s.key} className="mb-4">
              <div className="px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {s.label}
              </div>
              {items.map(renderNavItem)}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center p-2 rounded-lg bg-slate-50">
          <Avatar
            initials={currentUser.avatarInitials || (currentUser.name ?? currentUser.email).slice(0, 2)}
            color="bg-[#ef7c21]"
            size="sm"
          />
          <div className="ml-3 flex-1 overflow-hidden">
            <p className="text-sm font-medium text-slate-900 truncate">
              {currentUser.name || currentUser.email}
            </p>
            <p className="text-xs text-slate-500 truncate capitalize">{role}</p>
          </div>
          <button
            onClick={onLogout}
            className="text-slate-400 hover:text-[#ef7c21] ml-2 transition-colors duration-200"
            aria-label="Se déconnecter"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
