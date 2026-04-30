import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Ticket, User } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PriorityIndicator } from '../components/ui/PriorityIndicator';
import { Avatar } from '../components/ui/Avatar';
import {
  Search,
  Filter,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';

interface TicketsListProps {
  tickets: Ticket[];
  currentUser: User;
  mode?: 'all' | 'my-tickets';
}

export function TicketsList({
  tickets,
  currentUser,
  mode = 'all'
}: TicketsListProps) {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const statusTabs =
    mode === 'all'
      ? ['all', 'fresh']
      : ['all', 'pending', 'closed'];

  const filteredTickets = tickets.filter((ticket) => {
    const isClientOrSubclient =
      currentUser.role === 'client' || currentUser.role === 'subclient';

    if (mode === 'all') {
      if (!isClientOrSubclient && currentUser.role !== 'manager' && currentUser.role !== 'Admin') {
        if (ticket.status !== 'fresh') return false;
      }
      if (
        (currentUser.role === 'manager' || currentUser.role === 'Admin' || isClientOrSubclient) &&
        filterStatus !== 'all' &&
        ticket.status !== filterStatus
      ) {
        return false;
      }
    } else {
      if (
        currentUser.role === 'subclient' &&
        ticket.subClientUserId !== currentUser.id
      ) {
        return false;
      }
      if (currentUser.role !== 'subclient' && ticket.userId !== currentUser.id)
        return false;
      if (filterStatus !== 'all' && ticket.status !== filterStatus) {
        return false;
      }
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        ticket.title.toLowerCase().includes(searchLower) ||
        ticket.clientName.toLowerCase().includes(searchLower) ||
        ticket.id.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const baseTickets = tickets.filter((ticket) => {
    const isClientOrSubclient =
      currentUser.role === 'client' || currentUser.role === 'subclient';
    if (mode === 'all') {
      if (
        !isClientOrSubclient &&
        currentUser.role !== 'manager' &&
        currentUser.role !== 'Admin' &&
        ticket.status !== 'fresh'
      )
        return false;
    } else {
      if (currentUser.role === 'subclient') {
        if (ticket.subClientUserId !== currentUser.id) return false;
      } else if (ticket.userId !== currentUser.id) {
        return false;
      }
    }
    return true;
  });

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isClientOrSubclient =
    currentUser.role === 'client' || currentUser.role === 'subclient';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {mode === 'all' ? 'All Tickets' : 'My Tickets'}
          </h2>
          <p className="text-sm text-slate-500">
            {mode === 'all'
              ? currentUser.role === 'manager' || currentUser.role === 'Admin'
                ? 'All support requests across teams'
                : isClientOrSubclient
                ? 'All tickets from your organization'
                : 'Fresh tickets available to claim in your team'
              : 'Tickets assigned to you'}
          </p>
        </div>
        {currentUser.role !== 'client' && (
          <Button onClick={() => navigate('/create-ticket')}>
            <Plus className="h-4 w-4 mr-2" />
            New ticket
          </Button>
        )}
      </div>

      <Card className="flex flex-col" noPadding>
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={
                mode === 'all'
                  ? 'Search in all tickets...'
                  : 'Search in my tickets...'
              }
              className="w-full pl-9 pr-4 py-2 rounded-md border border-slate-300 text-sm focus:ring-2 focus:ring-[#ef7c21] focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
            <Button
              variant="outline"
              size="sm"
              className="whitespace-nowrap"
              onClick={() => setFilterStatus('all')}
            >
              <Filter className="h-3 w-3 mr-2" />
              Add filter
            </Button>
          </div>
        </div>

        <div className="flex border-b border-slate-200 px-4 bg-slate-50 overflow-x-auto">
          {((currentUser.role === 'manager' || currentUser.role === 'Admin' || isClientOrSubclient) &&
          mode === 'all'
            ? ['all', 'fresh', 'pending', 'closed']
            : statusTabs
          ).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap capitalize ${
                filterStatus === status
                  ? 'border-[#ef7c21] text-[#ef7c21]'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {status === 'all' ? 'All' : `${status}`}
              <span className="ml-2 bg-slate-200 text-slate-600 py-0.5 px-2 rounded-full text-xs">
                {status === 'all'
                  ? baseTickets.length
                  : baseTickets.filter((t) => t.status === status).length}
              </span>
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-10">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-[#ef7c21] focus:ring-[#ef7c21]"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Requester
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Last Message
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {paginatedTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                >
                  <td
                    className="px-6 py-4 whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-[#ef7c21] focus:ring-[#ef7c21]"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Avatar
                        initials={ticket.clientName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                        className="mr-3 bg-slate-400"
                      />
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {ticket.clientName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {ticket.clientEmail}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <PriorityIndicator priority={ticket.priority} />
                      <span className="ml-2 text-sm text-slate-900 font-medium truncate max-w-xs block">
                        {ticket.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {ticket.userId ? (
                      <span className="text-slate-900">Assigned</span>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {ticket.lastMessageTime || 'Just now'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedTickets.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-16 text-center text-slate-500"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <Search className="h-12 w-12 text-slate-300 mb-4" />
                      <p className="text-lg font-medium text-slate-900">
                        No tickets found
                      </p>
                      <p className="text-sm text-slate-500">
                        Try adjusting your filters or create a new ticket.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white px-4 py-3 border-t border-slate-200 flex items-center justify-between sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-700">
                Showing{' '}
                <span className="font-medium">
                  {filteredTickets.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredTickets.length)}
                </span>{' '}
                of <span className="font-medium">{filteredTickets.length}</span>{' '}
                results
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === idx + 1
                        ? 'z-10 bg-orange-50 border-[#ef7c21] text-[#ef7c21]'
                        : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
