'use client';

import { useState, useEffect } from 'react';

export default function DataTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
    }
    setLoading(false);
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
    
    window.html2pdf().set(opt).from(element).save();
  };

  const shareWhatsApp = () => {
    // Generate the message to share
    const text = `*DPIMS Report Summary*\nTotal Records: ${data.length}\nDate: ${new Date().toLocaleDateString()}\n\nNote: Please check the system for the full PDF report.`;
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
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
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>தரவுகள் ஏற்றப்படுகின்றன...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>தரவுகள் ஏதும் காணப்படவில்லை</td></tr>
            ) : (
              data.map((person) => (
                <tr key={person.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{person.registrationNumber}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{person.nic}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{person.fullName}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{person.gender}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{person.gnDivision?.name || 'N/A'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
