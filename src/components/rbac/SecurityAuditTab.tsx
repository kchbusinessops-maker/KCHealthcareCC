import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuditLog } from '../../types';
import { api } from '../../services/api';
import { 
  ShieldCheck, Search, Download, RefreshCw, Filter, 
  Clock, AlertTriangle, CheckCircle2, User, KeyRound, Lock, Info
} from 'lucide-react';

export const SecurityAuditTab: React.FC = () => {
  const { currentCentre } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const fetchLogs = async () => {
    if (!currentCentre) return;
    setLoading(true);
    try {
      const data = await api.getAuditLogs(currentCentre.id);
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentCentre?.id]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.userRole && log.userRole.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesAction = 
      actionFilter === 'all' ||
      (actionFilter === 'auth' && (log.action.includes('LOGIN') || log.action.includes('PIN') || log.action.includes('CREDENTIAL') || log.action.includes('LOCKDOWN'))) ||
      (actionFilter === 'rbac' && (log.action.includes('RBAC') || log.action.includes('ROLE'))) ||
      (actionFilter === 'clinical' && (log.action.includes('ORDER') || log.action.includes('SAMPLE') || log.action.includes('BATCH')));

    return matchesSearch && matchesAction;
  });

  const exportCsv = () => {
    if (filteredLogs.length === 0) return;
    const headers = ['Timestamp', 'Action', 'User', 'Role', 'Target Resource', 'Details'];
    const rows = filteredLogs.map((l) => [
      `"${new Date(l.timestamp).toLocaleString()}"`,
      `"${l.action}"`,
      `"${l.userName}"`,
      `"${l.userRole}"`,
      `"${l.resource}"`,
      `"${l.details.replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Security_Audit_Log_${currentCentre?.code || 'Centre'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Security & Authorization Audit Trail
              </h2>
              <p className="text-xs text-slate-500">
                Immutable chronological log of authentications, role modifications, supervisor PIN authorizations, and security events for {currentCentre?.name}.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={exportCsv}
            disabled={filteredLogs.length === 0}
            className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Audit CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Security Events' },
            { id: 'auth', label: 'Auth & PIN Overrides' },
            { id: 'rbac', label: 'RBAC & Roles' },
            { id: 'clinical', label: 'Orders & Pre-analytics' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActionFilter(f.id)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-medium ${
                actionFilter === f.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audit trail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-xs border-b border-slate-800">
                <th className="py-3 px-4 font-bold">Timestamp</th>
                <th className="py-3 px-4 font-bold">Action / Event</th>
                <th className="py-3 px-4 font-bold">Authenticated User</th>
                <th className="py-3 px-4 font-bold">Target Resource</th>
                <th className="py-3 px-4 font-bold">Security Narrative & Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No security audit logs found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isCritical = log.action.includes('LOCKDOWN') || log.action.includes('CANCEL');
                  const isHigh = log.action.includes('PIN') || log.action.includes('CREDENTIAL') || log.action.includes('RBAC');

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}{' '}
                        <span className="text-[10px] text-slate-400">({new Date(log.timestamp).toLocaleDateString()})</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border inline-block ${
                          isCritical ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          isHigh ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs">
                          {log.userName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {log.userRole}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-slate-600 font-mono text-[11px]">
                          {log.resource}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-700 max-w-md">
                        {log.details}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
