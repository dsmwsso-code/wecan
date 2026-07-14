'use client';

import { useState, useEffect } from 'react';
import ProfileModal from './ProfileModal';

export default function DataTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState(null);

  useEffect(() => {
    fetchData();
  }, [search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/persons?search=${search}`);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('நிச்சயமாக இந்த நபரின் விபரங்களை நீக்க வேண்டுமா? இந்தச் செயலை மாற்ற முடியாது.')) {
      return;
    }

    try {
      const res = await fetch(`/api/persons/${id}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      
      if (result.success) {
        alert('வெற்றிகரமாக நீக்கப்பட்டது!');
        fetchData(); // Refresh the table
      } else {
        alert(result.error || 'நீக்குவதில் பிழை ஏற்பட்டது.');
      }
    } catch (error) {
      console.error('Error deleting person:', error);
      alert('நீக்குவதில் பிழை ஏற்பட்டது.');
    }
  };

  const exportPDF = async () => {
    const element = document.getElementById('table-container');
    if (!element) return;
    
    // Load html2pdf dynamically
    if (!window.html2pdf) {
      await new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = resolve;
        document.body.appendChild(script);
      });
    }
    
    const opt = {
      margin: 10,
      filename: 'DPIMS_Report.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    
    const header = document.getElementById('pdf-header');
    if (header) header.style.display = 'block';
    
    window.html2pdf().set(opt).from(element).save().then(() => {
      if (header) header.style.display = 'none';
    });
  };

  const shareWhatsApp = () => {
    if (data.length === 0) {
      alert('பகிர்வதற்கு எந்த விபரங்களும் இல்லை.');
      return;
    }

    let text = '*விசேட தேவையுடையோர் விபரங்கள் (DPIMS)*\n\n';
    
    data.forEach((p, index) => {
      text += `${index + 1}. ${p.fullName}\n`;
      text += `NIC: ${p.nic}\n`;
      text += `பாலினம்: ${p.gender}\n`;
      text += `GN பிரிவு: ${p.gnDivision?.name || '-'}\n`;
      text += `குறைபாட்டின் வகை: ${p.disabilityType?.name || '-'}\n`;
      text += `தொலைபேசி இல.: ${p.mobileNumber || '-'}\n\n`;
    });

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const exportExcel = () => {
    // Basic CSV generation for Excel
    const headers = ['Reg No', 'NIC', 'Full Name', 'Gender', 'GN Division', 'Disability Type'];
    const rows = data.map(person => [
      person.registrationNumber,
      person.nic,
      person.fullName,
      person.gender,
      person.gnDivision?.name || 'N/A',
      person.disabilityType?.name || 'N/A',
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'DPIMS_Report.csv';
    link.click();
  };

  return (
    <div className="card" style={{ marginTop: '2rem' }} id="table-container">
      {/* This header is visually hidden in normal view if needed, but for simplicity let's make it visible only in PDF or just a nice header for the card */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem', display: 'none' }} id="pdf-header">
        <h3>Disabled Persons Information Management System (DPIMS)</h3>
        <p>Report Generated On: {new Date().toLocaleDateString()}</p>
      </div>

      <div data-html2canvas-ignore="true" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <input 
            type="text" 
            placeholder="தேடுக (பெயர், NIC, பதிவு இலக்கம்...)" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: '300px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={exportPDF} className="btn" style={{ backgroundColor: '#dc2626', color: 'white' }}>PDF அறிக்கை</button>
          <button onClick={exportExcel} className="btn" style={{ backgroundColor: '#16a34a', color: 'white' }}>Excel அறிக்கை</button>
          <button onClick={shareWhatsApp} className="btn" style={{ backgroundColor: '#25D366', color: 'white' }}>WhatsApp இல் பகிர்க</button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
              <th style={{ padding: '1rem 0.5rem' }}>பதிவு இல.</th>
              <th style={{ padding: '1rem 0.5rem' }}>NIC</th>
              <th style={{ padding: '1rem 0.5rem' }}>முழுப் பெயர்</th>
              <th style={{ padding: '1rem 0.5rem' }}>பாலினம்</th>
              <th style={{ padding: '1rem 0.5rem' }}>GN பிரிவு</th>
              <th style={{ padding: '1rem 0.5rem', textAlign: 'center' }} data-html2canvas-ignore="true">செயற்பாடு</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>தரவுகள் ஏற்றப்படுகின்றன...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>தரவுகள் ஏதும் காணப்படவில்லை</td></tr>
            ) : (
              data.map((person) => (
                <tr key={person.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{person.registrationNumber}</td>
                  <td style={{ padding: '1rem 0.5rem' }}>{person.nic}</td>
                  <td style={{ padding: '1rem 0.5rem', fontWeight: '500' }}>{person.fullName}</td>
                  <td style={{ padding: '1rem 0.5rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      backgroundColor: person.gender === 'Male' ? '#dbeafe' : '#fce7f3', 
                      color: person.gender === 'Male' ? '#1e40af' : '#be185d', 
                      borderRadius: '9999px',
                      fontSize: '0.85rem'
                    }}>
                      {person.gender}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 0.5rem' }}>{person.gnDivision?.name}</td>
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }} data-html2canvas-ignore="true">
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button 
                        onClick={() => setSelectedPersonId(person.id)}
                        style={{
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        பார்வை
                      </button>
                      <button 
                        onClick={() => window.location.href = `/admin/edit/${person.id}`}
                        style={{
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        திருத்து
                      </button>
                      <button 
                        onClick={() => handleDelete(person.id)}
                        style={{
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        அழி
                      </button>
                    </div>
                  </td> 
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ProfileModal 
        personId={selectedPersonId} 
        onClose={() => setSelectedPersonId(null)} 
      />
    </div>
  );
}
