import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Activity, Clock } from 'lucide-react';
import api from '../services/api';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const limit = 50;
  const totalPages = Math.ceil(total / limit);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/audit-logs?page=${page}&limit=${limit}`);
      setLogs(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      alert('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: '"Inter", "Plus Jakarta Sans", system-ui, sans-serif' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={24} color="#3b82f6" /> Audit Logs
          </h1>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '0.875rem' }}>Track user activity, system changes, and access logs</p>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={24} style={{ animation: 'spin 2s linear infinite' }} />
            <span>Loading audit history...</span>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            <p style={{ margin: 0, fontWeight: 500, color: '#374151' }}>No logs found</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: '800px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date / Time</th>
                    <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User</th>
                    <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</th>
                    <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Entity</th>
                    <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, index) => (
                    <tr key={log.id} style={{ borderBottom: index === logs.length - 1 ? 'none' : '1px solid #e5e7eb', transition: 'background-color 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#4b5563', whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{ fontWeight: 600, color: '#111827', fontSize: '0.875rem' }}>{log.user?.name || 'System'}</span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{ display: 'inline-flex', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#f1f5f9', color: '#334155' }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#4b5563' }}>
                        <span style={{ fontWeight: 500 }}>{log.entityType}</span> <span style={{ color: '#9ca3af' }}>({log.entityId || 'N/A'})</span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.875rem', color: '#374151' }}>
                        {log.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb', fontSize: '0.875rem', color: '#6b7280', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  Showing <strong>{(page - 1) * limit + 1}</strong>–<strong>{Math.min(page * limit, total)}</strong> of <strong>{total}</strong> logs
                </span>
                
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', padding: 0, border: '1px solid #d1d5db', background: 'white', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>{page} / {totalPages}</span>
                  <button 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', padding: 0, border: '1px solid #d1d5db', background: 'white', borderRadius: '6px', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
