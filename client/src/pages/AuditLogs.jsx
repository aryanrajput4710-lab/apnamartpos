import { useState, useEffect } from 'react';
import api from '../services/api';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = async () => {
    try {
      const res = await api.get(`/audit-logs?page=${page}&limit=50`);
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
  }, [page]);

  if (loading) return <div>Loading logs...</div>;

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Audit Logs</h2>
      <div className="table-responsive"><table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
        <thead>
          <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
            <th style={{ padding: '0.75rem' }}>Date/Time</th>
            <th style={{ padding: '0.75rem' }}>User</th>
            <th style={{ padding: '0.75rem' }}>Action</th>
            <th style={{ padding: '0.75rem' }}>Entity</th>
            <th style={{ padding: '0.75rem' }}>Description</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '0.75rem' }}>{new Date(log.createdAt).toLocaleString()}</td>
              <td style={{ padding: '0.75rem' }}>{log.user?.name || 'System'}</td>
              <td style={{ padding: '0.75rem' }}>{log.action}</td>
              <td style={{ padding: '0.75rem' }}>{log.entityType} ({log.entityId || 'N/A'})</td>
              <td style={{ padding: '0.75rem' }}>{log.description}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
        <span>Page {page} of {Math.ceil(total / 50)}</span>
        <button disabled={page * 50 >= total} onClick={() => setPage(p => p + 1)}>Next</button>
      </div>
    </div>
  );
}

