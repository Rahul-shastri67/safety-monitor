import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Download } from 'lucide-react';
import { alertAPI } from '../services/api';
import AlertBadge, { SeverityBadge, StatusBadge } from '../components/AlertBadge';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const TYPES     = ['', 'fight', 'fall', 'crowd_anomaly', 'intrusion', 'normal'];
const SEVERITIES = ['', 'critical', 'high', 'medium', 'low'];
const STATUSES   = ['', 'active', 'acknowledged', 'resolved', 'false_positive'];

export default function History() {
  const { isOperator } = useAuth();
  const [alerts, setAlerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ type: '', severity: '', status: '', from: '', to: '', search: '' });
  const [selected, setSelected] = useState(new Set());
  const [noteModal, setNoteModal] = useState(null); // { id, action }
  const [note, setNote] = useState('');

  const fetchAlerts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 15, sort: '-detectedAt' };
      if (filters.type)     params.type     = filters.type;
      if (filters.severity) params.severity = filters.severity;
      if (filters.status)   params.status   = filters.status;
      if (filters.from)     params.from     = filters.from;
      if (filters.to)       params.to       = filters.to;

      const res = await alertAPI.getAll(params);
      setAlerts(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchAlerts(1); }, [filters]);

  const handleFilter = e => setFilters(p => ({ ...p, [e.target.name]: e.target.value }));

  const toggleSelect = id => setSelected(s => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const acknowledge = async (id) => {
    try {
      await alertAPI.acknowledge(id, { notes: note });
      toast.success('Alert acknowledged');
      setNoteModal(null);
      setNote('');
      fetchAlerts(pagination.page);
    } catch { toast.error('Failed to acknowledge'); }
  };

  const resolve = async (id, falsePositive = false) => {
    try {
      await alertAPI.resolve(id, { notes: note, falsePositive });
      toast.success(falsePositive ? 'Marked as false positive' : 'Alert resolved');
      setNoteModal(null);
      setNote('');
      fetchAlerts(pagination.page);
    } catch { toast.error('Failed to resolve'); }
  };

  const exportCSV = () => {
    const rows = [
      ['ID', 'Type', 'Severity', 'Camera', 'Location', 'Confidence', 'Status', 'Detected At'],
      ...alerts.map(a => [
        a._id, a.type, a.severity, a.camera?.name, a.camera?.location,
        (a.confidence * 100).toFixed(1) + '%', a.status,
        format(new Date(a.detectedAt), 'yyyy-MM-dd HH:mm:ss'),
      ]),
    ];
    const csv  = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `incidents-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Incident History</h1>
          <p className="text-slate-400 text-sm mt-1">{pagination.total} total incidents logged</p>
        </div>
        <button onClick={exportCSV} className="btn-ghost flex items-center gap-2 text-sm border border-surface-border">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <select name="type" value={filters.type} onChange={handleFilter}
            className="input text-sm col-span-1">
            <option value="">All Types</option>
            {TYPES.filter(Boolean).map(t => (
              <option key={t} value={t}>{t.replace('_', ' ')}</option>
            ))}
          </select>
          <select name="severity" value={filters.severity} onChange={handleFilter} className="input text-sm">
            <option value="">All Severity</option>
            {SEVERITIES.filter(Boolean).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select name="status" value={filters.status} onChange={handleFilter} className="input text-sm">
            <option value="">All Status</option>
            {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <input type="date" name="from" value={filters.from} onChange={handleFilter}
            className="input text-sm text-slate-400" />
          <input type="date" name="to" value={filters.to} onChange={handleFilter}
            className="input text-sm text-slate-400" />
          <button onClick={() => setFilters({ type: '', severity: '', status: '', from: '', to: '' })}
            className="btn-ghost text-sm border border-surface-border">
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                {['Type', 'Camera', 'Confidence', 'Severity', 'Status', 'Detected', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-surface-border/50">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-surface-border rounded animate-pulse w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-500">
                    <Filter size={28} className="mx-auto mb-2 opacity-30" />
                    No incidents match your filters
                  </td>
                </tr>
              ) : (
                alerts.map(alert => (
                  <tr key={alert._id}
                    className="border-b border-surface-border/50 hover:bg-surface-hover/50 transition-colors">
                    <td className="px-4 py-3"><AlertBadge type={alert.type} /></td>
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{alert.camera?.name}</p>
                      <p className="text-slate-500 text-xs">{alert.camera?.location}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-surface-border rounded-full overflow-hidden">
                          <div className="h-full bg-brand rounded-full" style={{ width: `${alert.confidence * 100}%` }} />
                        </div>
                        <span className="text-white text-xs">{(alert.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><SeverityBadge severity={alert.severity} /></td>
                    <td className="px-4 py-3"><StatusBadge status={alert.status} /></td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {format(new Date(alert.detectedAt), 'MMM d, HH:mm:ss')}
                    </td>
                    <td className="px-4 py-3">
                      {alert.status === 'active' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setNoteModal({ id: alert._id, action: 'acknowledge' })}
                            className="text-xs text-brand hover:text-brand-light font-medium"
                          >
                            Ack
                          </button>
                          {isOperator && (
                            <button
                              onClick={() => setNoteModal({ id: alert._id, action: 'resolve' })}
                              className="text-xs text-success hover:text-success/80 font-medium"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      )}
                      {alert.status === 'acknowledged' && isOperator && (
                        <button
                          onClick={() => setNoteModal({ id: alert._id, action: 'resolve' })}
                          className="text-xs text-success hover:text-success/80 font-medium"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-border">
            <span className="text-xs text-slate-500">
              Page {pagination.page} of {pagination.pages} · {pagination.total} records
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => fetchAlerts(pagination.page - 1)} disabled={pagination.page <= 1}
                className="p-1.5 rounded hover:bg-surface-hover text-slate-400 hover:text-white disabled:opacity-30 transition-colors">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const p = Math.max(1, pagination.page - 2) + i;
                if (p > pagination.pages) return null;
                return (
                  <button key={p} onClick={() => fetchAlerts(p)}
                    className={`w-7 h-7 rounded text-xs font-semibold transition-colors ${p === pagination.page ? 'bg-brand text-white' : 'text-slate-400 hover:text-white hover:bg-surface-hover'}`}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => fetchAlerts(pagination.page + 1)} disabled={pagination.page >= pagination.pages}
                className="p-1.5 rounded hover:bg-surface-hover text-slate-400 hover:text-white disabled:opacity-30 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Note Modal */}
      {noteModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md animate-fade-in">
            <h3 className="font-semibold text-white mb-1 capitalize">
              {noteModal.action} Alert
            </h3>
            <p className="text-slate-400 text-sm mb-4">Add an optional note for this action</p>
            <textarea
              value={note} onChange={e => setNote(e.target.value)}
              rows={3} placeholder="Optional notes..."
              className="input resize-none mb-4"
            />
            <div className="flex items-center gap-3">
              {noteModal.action === 'acknowledge' ? (
                <button onClick={() => acknowledge(noteModal.id)} className="btn-primary flex-1">
                  Acknowledge
                </button>
              ) : (
                <>
                  <button onClick={() => resolve(noteModal.id, false)} className="btn-primary flex-1">
                    Mark Resolved
                  </button>
                  <button onClick={() => resolve(noteModal.id, true)}
                    className="flex-1 py-2 text-sm font-semibold rounded-lg border border-surface-border text-slate-400 hover:text-white hover:border-slate-600 transition-all">
                    False Positive
                  </button>
                </>
              )}
              <button onClick={() => { setNoteModal(null); setNote(''); }} className="btn-ghost">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
