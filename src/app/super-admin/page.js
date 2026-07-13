'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleDownload = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/backup');
      
      if (!res.ok) throw new Error('Download failed');
      
      // Handle file download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Extract filename from Content-Disposition header if possible, else default
      const contentDisposition = res.headers.get('Content-Disposition');
      let filename = `wecan-backup-${new Date().toISOString().split('T')[0]}.db`;
      if (contentDisposition && contentDisposition.includes('filename=')) {
        filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error(error);
      alert('Backup download failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleRestore = async () => {
    if (!selectedFile) return;
    
    if (!confirm('எச்சரிக்கை: நீங்கள் Restore செய்யும் போது தற்போதுள்ள தரவுகள் அனைத்தும் முற்றுமுழுதாக அழிக்கப்பட்டுவிடும். நீங்கள் உறுதியாக Restore செய்ய விரும்புகிறீர்களா?')) {
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('db_file', selectedFile);

      const res = await fetch('/api/backup', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        alert('தரவுத்தளம் வெற்றிகரமாக Restore செய்யப்பட்டது!');
        setSelectedFile(null);
        // Refresh page or clear input
        window.location.reload();
      } else {
        alert(`Restore தோல்வி: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      alert('Restore failed due to network or server error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--primary-blue)' }}>DPIMS முதன்மை நிர்வாகி (Super Admin Dashboard)</h1>
          <p style={{ color: 'var(--text-secondary)' }}>முழுமையான கணினி நிர்வாகம்</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/" className="btn" style={{ border: '1px solid var(--border-color)' }}>
            பொதுப் புள்ளிவிவரங்கள்
          </Link>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Data Entry (Registration) */}
        <div className="card">
          <h2 style={{ color: 'var(--primary-blue)', marginBottom: '1rem' }}>தரவுப் பதிவு (Data Entry)</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            புதிய நபர்களைப் பதிவு செய்தல் மற்றும் ஏற்கனவே உள்ள விபரங்களைப் பார்வையிடுதல்.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
            <Link href="/admin/register" className="btn btn-primary" style={{ width: '100%', display: 'block', textAlign: 'center' }}>புதிய நபரைப் பதிவு செய்ய</Link>
            <Link href="/admin/dashboard" className="btn" style={{ width: '100%', display: 'block', textAlign: 'center', border: '1px solid var(--border-color)' }}>பதிவு செய்த விபரங்கள்</Link>
          </div>
        </div>

        {/* Reports */}
        <div className="card">
          <h2 style={{ color: '#10b981', marginBottom: '1rem' }}>அறிக்கைகள் (Reports)</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            தரவுகளைப் பல்வேறு அடிப்படைகளில் வடிகட்டி அறிக்கைகளாகப் (PDF/Excel) பெற்றுக்கொள்ளுதல்.
          </p>
          <Link href="/admin/reports" className="btn" style={{ width: '100%', display: 'block', textAlign: 'center', backgroundColor: '#10b981', color: 'white', border: 'none' }}>அறிக்கைகளைப் பார்வையிட</Link>
        </div>

        {/* User Management */}
        <div className="card">
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>பயனர் முகாமைத்துவம் (User Management)</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            புதிய கணக்குகளை உருவாக்குதல், கடவுச்சொற்களை மாற்றுதல், கணக்குகளை முடக்குதல்.
          </p>
          <Link href="/super-admin/users" className="btn btn-primary" style={{ width: '100%', display: 'block', textAlign: 'center' }}>பயனர்களை நிர்வகிக்க</Link>
        </div>

        {/* Master Data */}
        <div className="card">
          <h2 style={{ color: 'var(--primary-blue)', marginBottom: '1rem' }}>அடிப்படைத் தரவுகள் (Master Data)</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            GN பிரிவுகள், குறைபாடுகளின் வகைகள் போன்ற அடிப்படைத் தரவுகளைச் சேர்த்தல்/திருத்துதல்.
          </p>
          <Link href="/super-admin/master-data" className="btn btn-primary" style={{ width: '100%', display: 'block', textAlign: 'center' }}>அடிப்படைத் தரவுகளை நிர்வகிக்க</Link>
        </div>

        {/* Committee Management */}
        <div className="card">
          <h2 style={{ color: 'var(--primary-blue)', marginBottom: '1rem' }}>நிர்வாகக் குழு (Committee)</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            அமைப்பின் தலைவர், செயலாளர் போன்ற நிர்வாகக் குழுவினரின் விபரங்களை நிர்வகிக்க.
          </p>
          <Link href="/super-admin/committee" className="btn btn-primary" style={{ width: '100%', display: 'block', textAlign: 'center' }}>நிர்வாகிகளை நிர்வகிக்க</Link>
        </div>

        {/* Photo Gallery */}
        <div className="card">
          <h2 style={{ color: 'var(--primary-blue)', marginBottom: '1rem' }}>Photo Gallery</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            முகப்புப் பக்கத்தில் தோன்றும் செயற்திட்ட புகைப்படங்களைப் பதிவேற்றம் செய்ய / நீக்க.
          </p>
          <Link href="/super-admin/gallery" className="btn btn-primary" style={{ width: '100%', display: 'block', textAlign: 'center' }}>Gallery நிர்வகிக்க</Link>
        </div>

        {/* System Logs */}
        <div className="card">
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>கணினி பதிவுகள் (Audit Logs)</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            கணினியில் மேற்கொள்ளப்பட்ட அனைத்து நடவடிக்கைகளையும் கண்காணித்தல்.
          </p>
          <Link href="/super-admin/logs" className="btn btn-primary" style={{ width: '100%', display: 'block', textAlign: 'center' }}>பதிவுகளைப் பார்க்க</Link>
        </div>

        {/* Database Backup */}
        <div className="card">
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>தரவுத்தளப் பாதுகாப்பு (Backup & Restore)</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            தரவுத்தளத்தைப் பாதுகாப்பாக Download செய்யவும், தேவைப்படும்போது மீண்டும் Upload (Restore) செய்யவும்.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button 
              onClick={handleDownload} 
              disabled={loading}
              className="btn btn-primary" 
              style={{ width: '100%', backgroundColor: '#10b981' }}
            >
              {loading ? 'Downloading...' : 'தரவுத்தளத்தை Download செய்க'}
            </button>
            
            <div style={{ padding: '1rem', border: '1px dashed #ef4444', borderRadius: '4px', marginTop: '0.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#b91c1c', fontWeight: 'bold', fontSize: '0.9rem' }}>
                Restore Database (எச்சரிக்கை: பழைய தரவுகள் அழியும்)
              </label>
              <input 
                type="file" 
                accept=".db" 
                onChange={handleFileChange}
                style={{ width: '100%', marginBottom: '0.5rem', fontSize: '0.9rem' }}
              />
              <button 
                onClick={handleRestore}
                disabled={!selectedFile || loading}
                className="btn" 
                style={{ width: '100%', backgroundColor: !selectedFile ? '#fca5a5' : '#ef4444', color: 'white', border: 'none' }}
              >
                {loading ? 'Restoring...' : 'Restore செய்க'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
