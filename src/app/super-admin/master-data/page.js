'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MasterDataManagement() {
  const [activeTab, setActiveTab] = useState('GnDivision');
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]); // To hold DisabilityCategories
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(''); // For new type
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');

  useEffect(() => {
    fetchData();
    setEditingId(null);
    setEditValue('');
    setEditCategoryId('');
    if (activeTab === 'DisabilityType') {
      fetchCategories();
    }
  }, [activeTab]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`/api/master-data?type=DisabilityCategory`);
      const result = await res.json();
      if (result.success) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await fetch(`/api/master-data?type=${activeTab}`);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching master data:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    if (activeTab === 'DisabilityType' && !selectedCategoryId) {
      setStatus({ type: 'error', message: 'குறைபாட்டின் வகையைத் தெரிவு செய்க.' });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const payload = { type: activeTab, name: newName };
      if (activeTab === 'DisabilityType') {
        payload.categoryId = selectedCategoryId;
      }

      const res = await fetch('/api/master-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        setStatus({ type: 'error', message: result.error || 'தரவைச் சேர்ப்பதில் பிழை.' });
      } else {
        setStatus({ type: 'success', message: 'புதிய தரவு வெற்றிகரமாகச் சேர்க்கப்பட்டது!' });
        setNewName('');
        setSelectedCategoryId('');
        fetchData(); // Refresh list
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'An unexpected error occurred.' });
    }
    setIsSubmitting(false);
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setEditValue(item.name);
    setEditCategoryId(item.categoryId || '');
  };

  const handleSaveEdit = async (id) => {
    if (!editValue.trim()) return;
    if (activeTab === 'DisabilityType' && !editCategoryId) {
      setStatus({ type: 'error', message: 'குறைபாட்டின் வகையைத் தெரிவு செய்க.' });
      return;
    }
    setStatus({ type: '', message: '' });

    try {
      const payload = { type: activeTab, id, name: editValue };
      if (activeTab === 'DisabilityType') {
        payload.categoryId = editCategoryId;
      }

      const res = await fetch('/api/master-data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        setStatus({ type: 'error', message: result.error || 'தரவைத் திருத்துவதில் பிழை.' });
      } else {
        setStatus({ type: 'success', message: 'தரவு வெற்றிகரமாகத் திருத்தப்பட்டது!' });
        setEditingId(null);
        fetchData();
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'An unexpected error occurred.' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('இந்தத் தரவை நிச்சயமாக நீக்க வேண்டுமா?')) return;
    setStatus({ type: '', message: '' });

    try {
      const res = await fetch(`/api/master-data?type=${activeTab}&id=${id}`, {
        method: 'DELETE',
      });

      const result = await res.json();

      if (!res.ok) {
        setStatus({ type: 'error', message: result.error || 'தரவை நீக்குவதில் பிழை.' });
      } else {
        setStatus({ type: 'success', message: 'தரவு வெற்றிகரமாக நீக்கப்பட்டது!' });
        fetchData();
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'An unexpected error occurred.' });
    }
  };

  const getTabLabel = (tab) => {
    if (tab === 'GnDivision') return 'கிராம உத்தியோகத்தர் பிரிவுகள்';
    if (tab === 'DisabilityCategory') return 'குறைபாடுகளின் வகைகள் (Categories)';
    if (tab === 'DisabilityType') return 'குறைபாடுகளின் தன்மைகள் (Types)';
    return tab;
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--primary-blue)' }}>அடிப்படைத் தரவுகள் (Master Data)</h1>
          <p style={{ color: 'var(--text-secondary)' }}>GN பிரிவுகள், குறைபாடுகளின் வகைகள் போன்றவற்றை நிர்வகித்தல்</p>
        </div>
        <div>
          <Link href="/super-admin" className="btn" style={{ border: '1px solid var(--border-color)' }}>
            &larr; பின்செல்க (Back)
          </Link>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '1rem' }}>
        {['GnDivision', 'DisabilityCategory', 'DisabilityType'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: activeTab === tab ? 'var(--primary-blue)' : 'transparent',
              color: activeTab === tab ? '#ffffff' : 'var(--text-primary)',
              border: activeTab === tab ? 'none' : '1px solid var(--border-color)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? '600' : '400'
            }}
          >
            {getTabLabel(tab)}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        {/* Create Form */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>புதிய தரவைச் சேர் (Add New)</h3>
          
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
            {activeTab === 'DisabilityType' && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label>குறைபாட்டின் வகை (Category)</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                >
                  <option value="">-- வகையைத் தெரிவு செய்க --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div style={{ marginBottom: '1.5rem' }}>
              <label>பெயர் (Name)</label>
              <input 
                type="text" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                required 
                placeholder={`Enter new ${getTabLabel(activeTab)}`}
                style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }} 
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} disabled={isSubmitting}>
              {isSubmitting ? 'சேமிக்கப்படுகிறது...' : 'புதிய தரவைச் சேமி'}
            </button>
          </form>
        </div>

        {/* Data List */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>பதிவு செய்யப்பட்ட தரவுகள்</h3>
          <div style={{ overflowX: 'auto', maxHeight: '500px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem 0.5rem', width: '15%' }}>ID</th>
                  {activeTab === 'DisabilityType' && <th style={{ padding: '1rem 0.5rem', width: '30%' }}>வகை (Category)</th>}
                  <th style={{ padding: '1rem 0.5rem' }}>பெயர் (Name)</th>
                  <th style={{ padding: '1rem 0.5rem', width: '25%' }}>செயற்பாடு</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={activeTab === 'DisabilityType' ? "4" : "3"} style={{ textAlign: 'center', padding: '2rem' }}>தரவுகள் ஏற்றப்படுகின்றன...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={activeTab === 'DisabilityType' ? "4" : "3"} style={{ textAlign: 'center', padding: '2rem' }}>தரவுகள் ஏதும் காணப்படவில்லை.</td></tr>
                ) : (
                  data.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{activeTab === 'GnDivision' ? `MN/${item.id}` : item.id}</td>
                      {activeTab === 'DisabilityType' && (
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          {editingId === item.id ? (
                            <select
                              value={editCategoryId}
                              onChange={(e) => setEditCategoryId(e.target.value)}
                              style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--primary-blue)', borderRadius: '4px' }}
                            >
                              <option value="">-- தெரிவு செய்க --</option>
                              {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)' }}>{item.category?.name || 'N/A'}</span>
                          )}
                        </td>
                      )}
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        {editingId === item.id ? (
                          <input 
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--primary-blue)', borderRadius: '4px' }}
                          />
                        ) : (
                          <span style={{ fontWeight: 'bold' }}>{item.name}</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        {editingId === item.id ? (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => handleSaveEdit(item.id)} style={{ color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>சேமி</button>
                            <button onClick={() => setEditingId(null)} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>ரத்து</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => handleEditClick(item)} style={{ color: 'var(--primary-blue)', background: 'none', border: 'none', cursor: 'pointer' }}>தொகு (Edit)</button>
                            <button onClick={() => handleDelete(item.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>நீக்கு (Delete)</button>
                          </div>
                        )}
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
