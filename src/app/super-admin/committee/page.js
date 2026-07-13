'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CommitteeManagement() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: null,
    role: '',
    fullName: '',
    phoneNumber: '',
    photoBase64: '',
    orderIndex: 0
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/committee');
      const result = await res.json();
      if (result.success) {
        setMembers(result.data);
      }
    } catch (error) {
      console.error('Error fetching committee members:', error);
    }
    setLoading(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photoBase64: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    const isEdit = formData.id !== null;
    const url = isEdit ? `/api/committee/${formData.id}` : '/api/committee';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (!res.ok) {
        setStatus({ type: 'error', message: result.error || 'பிழை ஏற்பட்டுள்ளது.' });
      } else {
        setStatus({ type: 'success', message: isEdit ? 'வெற்றிகரமாகத் திருத்தப்பட்டது!' : 'வெற்றிகரமாகச் சேர்க்கப்பட்டது!' });
        setFormData({ id: null, role: '', fullName: '', phoneNumber: '', photoBase64: '', orderIndex: 0 });
        fetchMembers();
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'An unexpected error occurred.' });
    }
    setIsSubmitting(false);
  };

  const handleEdit = (member) => {
    setFormData(member);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!confirm('நிச்சயமாக இந்த நபரை நீக்க வேண்டுமா?')) return;
    try {
      const res = await fetch(`/api/committee/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMembers();
      }
    } catch (err) {
      console.error('Error deleting member:', err);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--primary-blue)' }}>நிர்வாகக் குழுவினர் (Committee Members)</h1>
          <p style={{ color: 'var(--text-secondary)' }}>அமைப்பின் நிர்வாகிகளைச் சேர்த்தல் மற்றும் திருத்துதல்</p>
        </div>
        <div>
          <Link href="/super-admin" className="btn" style={{ border: '1px solid var(--border-color)' }}>
            &larr; பின்செல்க (Back)
          </Link>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        {/* Form */}
        <div className="card" style={{ alignSelf: 'start' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>{formData.id ? 'தகவல்களைத் திருத்து' : 'புதிய நபரைச் சேர்'}</h3>
          
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
              <label>பதவி (Role)</label>
              <input type="text" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} required placeholder="உ-ம்: தலைவர்" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label>முழுப்பெயர் (Full Name)</label>
              <input type="text" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} required style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label>தொலைபேசி இலக்கம் (Phone)</label>
              <input type="text" value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} required style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label>தோன்றும் ஒழுங்கு (Order Index)</label>
              <input type="number" value={formData.orderIndex} onChange={(e) => setFormData({...formData, orderIndex: parseInt(e.target.value)})} required style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
              <small style={{ color: 'gray' }}>0, 1, 2 என்ற ஒழுங்கில் காண்பிக்கப்படும்</small>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label>புகைப்படம் (Photo)</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
              {formData.photoBase64 && (
                <div style={{ marginTop: '1rem' }}>
                  <img src={formData.photoBase64} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%' }} />
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} disabled={isSubmitting}>
              {isSubmitting ? 'சேமிக்கப்படுகிறது...' : formData.id ? 'மாற்றங்களைச் சேமி' : 'புதிய நபரைச் சேமி'}
            </button>
            
            {formData.id && (
              <button type="button" onClick={() => setFormData({ id: null, role: '', fullName: '', phoneNumber: '', photoBase64: '', orderIndex: 0 })} className="btn" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', border: '1px solid var(--border-color)' }}>
                ரத்து செய்க (Cancel)
              </button>
            )}
          </form>
        </div>

        {/* List */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>பதிவு செய்யப்பட்டவர்கள்</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem 0.5rem' }}>படம்</th>
                  <th style={{ padding: '1rem 0.5rem' }}>பதவி</th>
                  <th style={{ padding: '1rem 0.5rem' }}>பெயர்</th>
                  <th style={{ padding: '1rem 0.5rem' }}>தொடர்பு</th>
                  <th style={{ padding: '1rem 0.5rem' }}>செயற்பாடு</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>தரவுகள் ஏற்றப்படுகின்றன...</td></tr>
                ) : members.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>தரவுகள் ஏதும் காணப்படவில்லை.</td></tr>
                ) : (
                  members.map((m) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        {m.photoBase64 ? (
                          <img src={m.photoBase64} alt={m.fullName} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 'bold' }}>{m.role}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{m.fullName}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{m.phoneNumber}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <button onClick={() => handleEdit(m)} style={{ marginRight: '0.5rem', color: 'var(--primary-blue)', background: 'none', border: 'none', cursor: 'pointer' }}>தொகு (Edit)</button>
                        <button onClick={() => handleDelete(m.id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>நீக்கு (Delete)</button>
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
