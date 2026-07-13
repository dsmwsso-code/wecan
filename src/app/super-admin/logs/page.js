'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs?limit=100');
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch logs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--primary-blue)' }}>கணினி பதிவுகள் (Audit Logs)</h1>
          <p style={{ color: 'var(--text-secondary)' }}>கணினியில் மேற்கொள்ளப்பட்ட அண்மைய நடவடிக்கைகள்</p>
        </div>
        <div>
          <Link href="/super-admin" className="btn" style={{ border: '1px solid var(--border-color)' }}>
            பின்னோக்கிச் செல்க (Back)
          </Link>
        </div>
      </header>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#991b1b', marginBottom: '1rem', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>Loading...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb' }}>திகதி & நேரம்</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb' }}>பயனர் (User)</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb' }}>செயற்பாடு (Action)</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb' }}>பதிவு (Entity)</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb' }}>IP முகவரி</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    பதிவுகள் எதுவும் இல்லை
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {new Date(log.timestamp).toLocaleString('ta-LK')}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {log.user ? `${log.user.username} (${log.user.role})` : 'System'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: log.action === 'DELETE' ? '#ef4444' : log.action === 'ADD' ? '#10b981' : 'var(--text-primary)' }}>
                      {log.action}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {log.entity} {log.entityId ? `(#${log.entityId})` : ''}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {log.ipAddress || 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
