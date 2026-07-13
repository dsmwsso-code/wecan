'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [gnDivisions, setGnDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ id: null, username: '', password: '', gnDivisionId: '', isActive: true });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchGnDivisions();
  }, []);

  const fetchGnDivisions = async () => {
    try {
      const res = await fetch('/api/master-data?type=GnDivision');
      const result = await res.json();
      if (result.success) {
        setGnDivisions(result.data);
      }
    } catch (error) {
      console.error('Error fetching GN Divisions:', error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const result = await res.json();
      if (result.success) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    const isEdit = formData.id !== null;
    const url = isEdit ? `/api/users/${formData.id}` : '/api/users';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: 'error', message: data.error || 'பிழை ஏற்பட்டுள்ளது.' });
      } else {
        setStatus({ type: 'success', message: isEdit ? 'கணக்கு வெற்றிகரமாகத் திருத்தப்பட்டது!' : 'புதிய கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது!' });
        setFormData({ id: null, username: '', password: '', gnDivisionId: '', isActive: true });
        fetchUsers(); // Refresh list
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'An unexpected error occurred.' });
    }
    setIsSubmitting(false);
  };

  const handleEdit = (user) => {
    setFormData({
      id: user.id,
      username: user.username,
      password: '', // Leave empty to keep existing
      gnDivisionId: user.gnDivisionId || '',
      isActive: user.isActive
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('நிச்சயமாக இந்தக் கணக்கை நீக்க வேண்டுமா?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'பிழை ஏற்பட்டுள்ளது.');
      } else {
        fetchUsers();
      }
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--primary-blue)' }}>பயனர் முகாமைத்துவம் (User Management)</h1>
          <p style={{ color: 'var(--text-secondary)' }}>கிராம உத்தியோகத்தர்களுக்கான கணக்குகளை உருவாக்குதல் / திருத்துதல்</p>
        </div>
        <div>
          <Link href="/super-admin" className="btn" style={{ border: '1px solid var(--border-color)' }}>
            &larr; பின்செல்க (Back)
          </Link>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        {/* Create/Edit User Form */}
        <div className="card" style={{ alignSelf: 'start' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>{formData.id ? 'கணக்கைத் திருத்து (Edit Account)' : 'புதிய கணக்கை உருவாக்கு'}</h3>
          
          {status.message && (
            <div style={{
              padding: '1rem',
              marginBottom: '1.5rem',
              backgroundColor: status.type === 'error' ? '#fee2e2' : '#d1fae5',
              color: status.type === 'error' ? '#991b1b' : '#065f46',
              borderRadius: '4px'
            }}>
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label>பயனர் பெயர் (Username)</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange} required style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label>கடவுச்சொல் (Password)</label>
              <input 
                type="password" 
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                required={!formData.id} 
                placeholder={formData.id ? 'மாற்ற விரும்பினால் மட்டும் தட்டச்சு செய்க' : ''}
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }} 
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label>கிராம உத்தியோகத்தர் பிரிவு (GN Division)</label>
              <select 
                name="gnDivisionId" 
                value={formData.gnDivisionId} 
                onChange={handleChange} 
                required 
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
              >
                <option value="">-- தெரிவு செய்க --</option>
                {gnDivisions.map((gn) => (
                  <option key={gn.id} value={gn.id}>MN/{gn.id} - {gn.name}</option>
                ))}
              </select>
            </div>

            {formData.id && (
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  id="isActive" 
                  name="isActive" 
                  checked={formData.isActive} 
                  onChange={handleChange} 
                />
                <label htmlFor="isActive">கணக்கு செயலில் உள்ளது (Active)</label>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} disabled={isSubmitting}>
              {isSubmitting ? 'சேமிக்கப்படுகிறது...' : formData.id ? 'மாற்றங்களைச் சேமி' : 'கணக்கை உருவாக்கு'}
            </button>
            
            {formData.id && (
              <button 
                type="button" 
                onClick={() => setFormData({ id: null, username: '', password: '', gnDivisionId: '', isActive: true })} 
                className="btn" 
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', border: '1px solid var(--border-color)' }}
              >
                ரத்து செய்க (Cancel)
              </button>
            )}
          </form>
        </div>

        {/* User List */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>பதிவு செய்யப்பட்ட கிராம உத்தியோகத்தர்கள்</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem 0.5rem' }}>பயனர் பெயர்</th>
                  <th style={{ padding: '1rem 0.5rem' }}>GN Division</th>
                  <th style={{ padding: '1rem 0.5rem' }}>நிலைமை (Status)</th>
                  <th style={{ padding: '1rem 0.5rem' }}>செயற்பாடு</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>கணக்குகள் ஏதும் காணப்படவில்லை.</td></tr>
                ) : (
                  users.filter(u => u.role !== 'SUPER_ADMIN').map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 'bold' }}>{user.username}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{user.gnDivisionId ? `MN/${user.gnDivisionId} ${user.gnDivision ? `- ${user.gnDivision.name}` : ''}` : '-'}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span style={{ padding: '0.25rem 0.5rem', backgroundColor: user.isActive ? '#d1fae5' : '#fee2e2', color: user.isActive ? '#065f46' : '#991b1b', borderRadius: '4px', fontSize: '0.8rem' }}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <button onClick={() => handleEdit(user)} style={{ marginRight: '0.5rem', color: 'var(--primary-blue)', background: 'none', border: 'none', cursor: 'pointer' }}>தொகு (Edit)</button>
                        <button onClick={() => handleDelete(user.id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>நீக்கு (Delete)</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
