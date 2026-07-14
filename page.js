'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import MultiSelect from '@/components/MultiSelect';

export default function ReportsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Master data for filters
  const [gnDivisions, setGnDivisions] = useState([]);
  const [disabilityCategories, setDisabilityCategories] = useState([]);
  const [disabilityTypes, setDisabilityTypes] = useState([]);

  // Filters state (now using arrays)
  const [filters, setFilters] = useState({
    gnDivisionId: [],
    disabilityCategoryId: [],
    disabilityTypeId: [],
    gender: [],
    ageGroup: [],
    assistanceType: []
  });

  useEffect(() => {
    fetchMasterData();
    fetchReports(); // Initial fetch
  }, []);

  const fetchMasterData = async () => {
    try {
      const [gnRes, dcRes, dtRes] = await Promise.all([
        fetch('/api/master-data?type=GnDivision'),
        fetch('/api/master-data?type=DisabilityCategory'),
        fetch('/api/master-data?type=DisabilityType')
      ]);
      const gnData = await gnRes.json();
      const dcData = await dcRes.json();
      const dtData = await dtRes.json();
      
      if (gnData.success) setGnDivisions(gnData.data);
      if (dcData.success) setDisabilityCategories(dcData.data);
      if (dtData.success) setDisabilityTypes(dtData.data);
    } catch (err) {
      console.error('Failed to load filter options');
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (filters.gnDivisionId.length > 0) query.append('gnDivisionId', filters.gnDivisionId.join(','));
      if (filters.disabilityCategoryId.length > 0) query.append('disabilityCategoryId', filters.disabilityCategoryId.join(','));
      if (filters.disabilityTypeId.length > 0) query.append('disabilityTypeId', filters.disabilityTypeId.join(','));
      if (filters.gender.length > 0) query.append('gender', filters.gender.join(','));
      if (filters.ageGroup.length > 0) query.append('ageGroup', filters.ageGroup.join(','));
      if (filters.assistanceType.length > 0) query.append('assistanceType', filters.assistanceType.join(','));

      const res = await fetch(`/api/reports?${query.toString()}`);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('அறிக்கைகளைப் பெறுவதில் சிக்கல் ஏற்பட்டது.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchReports();
  };

  const exportToCSV = () => {
    if (data.length === 0) return;

    const headers = ['பெயர்', 'பால்', 'வயது', 'கிராம சேவையாளர் பிரிவு', 'குறைபாட்டின் வகை', 'தொடர்பு எண்'];
    const rows = data.map(p => [
      p.fullName,
      p.gender === 'Male' ? 'ஆண்' : p.gender === 'Female' ? 'பெண்' : 'ஏனையவை',
      p.age,
      p.gnDivision?.name || '-',
      p.disabilityType?.name || '-',
      p.phoneNumber || '-'
    ]);

    let csvContent = "\uFEFF" + headers.join(',') + "\n"; // BOM for UTF-8 Excel support
    rows.forEach(row => {
      // Escape commas and quotes
      const safeRow = row.map(cell => `"${String(cell).replace(/"/g, '""')}"`);
      csvContent += safeRow.join(',') + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `wecan_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    if (data.length === 0) return;
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text("Wecan - Reports", 14, 15);
    
    const tableHeaders = [['Name', 'Gender', 'Age', 'GN Division', 'Disability Type', 'Phone']];
    const tableData = data.map(p => [
      p.fullName, 
      p.gender,
      p.age,
      p.gnDivision?.name || '-',
      p.disabilityType?.name || '-',
      p.phoneNumber || '-'
    ]);

    autoTable(doc, {
      head: tableHeaders,
      body: tableData,
      startY: 25,
      styles: { font: 'helvetica' } 
    });

    doc.save(`wecan_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Stats
  const total = data.length;
  const maleCount = data.filter(d => d.gender === 'Male').length;
  const femaleCount = data.filter(d => d.gender === 'Female').length;
  const childrenCount = data.filter(d => d.age < 18).length;
  const adultCount = data.filter(d => d.age >= 18 && d.age < 60).length;
  const elderlyCount = data.filter(d => d.age >= 60).length;

  // Filter Disability Types based on Categories if selected
  const filteredTypes = filters.disabilityCategoryId.length > 0
    ? disabilityTypes.filter(dt => filters.disabilityCategoryId.includes(String(dt.categoryId)))
    : disabilityTypes;

  // Options prep
  const gnOptions = gnDivisions.map(gn => ({ label: gn.name, value: String(gn.id) }));
  const categoryOptions = disabilityCategories.map(dc => ({ label: dc.name, value: String(dc.id) }));
  const typeOptions = filteredTypes.map(dt => ({ label: dt.name, value: String(dt.id) }));
  const genderOptions = [
    { label: 'ஆண்', value: 'Male' },
    { label: 'பெண்', value: 'Female' }
  ];
  const ageOptions = [
    { label: 'சிறுவர்கள் (<18)', value: 'child' },
    { label: 'பெரியவர்கள் (18-59)', value: 'adult' },
    { label: 'முதியவர்கள் (60+)', value: 'elderly' }
  ];
  const assistanceOptions = [
    { label: 'பண உதவி', value: 'financial' },
    { label: 'உபகரண உதவி', value: 'equipment' },
    { label: 'இரண்டும்', value: 'both' }
  ];

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--primary-blue)' }}>அறிக்கைகள் (Reports)</h1>
          <p style={{ color: 'var(--text-secondary)' }}>வடிகட்டப்பட்ட தரவுகளைப் பார்வையிடவும் தரவிறக்கம் செய்யவும்</p>
        </div>
        <div>
          <Link href="/admin/dashboard" className="btn" style={{ border: '1px solid var(--border-color)' }}>
            Dashboard
          </Link>
        </div>
      </header>

      {/* Filters Card */}
      <div className="card" style={{ marginBottom: '2rem', overflow: 'visible' }}>
        <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div style={{ zIndex: 6 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>GN பிரிவு</label>
            <MultiSelect options={gnOptions} selectedValues={filters.gnDivisionId} onChange={(val) => handleFilterChange('gnDivisionId', val)} />
          </div>
          <div style={{ zIndex: 5 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>குறைபாட்டின் வகை</label>
            <MultiSelect options={categoryOptions} selectedValues={filters.disabilityCategoryId} onChange={(val) => handleFilterChange('disabilityCategoryId', val)} />
          </div>
          <div style={{ zIndex: 4 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>குறைபாட்டின் தன்மை</label>
            <MultiSelect options={typeOptions} selectedValues={filters.disabilityTypeId} onChange={(val) => handleFilterChange('disabilityTypeId', val)} />
          </div>
          <div style={{ zIndex: 3 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>பால்</label>
            <MultiSelect options={genderOptions} selectedValues={filters.gender} onChange={(val) => handleFilterChange('gender', val)} />
          </div>
          <div style={{ zIndex: 2 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>வயதுப் பிரிவு</label>
            <MultiSelect options={ageOptions} selectedValues={filters.ageGroup} onChange={(val) => handleFilterChange('ageGroup', val)} />
          </div>
          <div style={{ zIndex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>பெற்ற உதவிகள்</label>
            <MultiSelect options={assistanceOptions} selectedValues={filters.assistanceType} onChange={(val) => handleFilterChange('assistanceType', val)} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', height: '38px', padding: '0' }}>
              {loading ? 'தேடுகிறது...' : 'தேடுக'}
            </button>
            <button type="button" onClick={() => setFilters({ gnDivisionId: [], disabilityCategoryId: [], disabilityTypeId: [], gender: [], ageGroup: [], assistanceType: [] })} className="btn" style={{ width: '100%', height: '38px', padding: '0', border: '1px solid #d1d5db' }}>Clear</button>
          </div>
        </form>
      </div>

      {/* Summary Stats */}
      {data.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card" style={{ padding: '1rem', textAlign: 'center', borderTop: '4px solid var(--primary-blue)' }}>
            <h4 style={{ margin: 0, color: 'var(--text-secondary)' }}>மொத்தம்</h4>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>{total}</p>
          </div>
          <div className="card" style={{ padding: '1rem', textAlign: 'center', borderTop: '4px solid #3b82f6' }}>
            <h4 style={{ margin: 0, color: 'var(--text-secondary)' }}>ஆண்கள் / பெண்கள்</h4>
            <p style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>{maleCount} / {femaleCount}</p>
          </div>
          <div className="card" style={{ padding: '1rem', textAlign: 'center', borderTop: '4px solid #10b981' }}>
            <h4 style={{ margin: 0, color: 'var(--text-secondary)' }}>சிறுவர்/பெரியவர்/முதியவர்</h4>
            <p style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>{childrenCount} / {adultCount} / {elderlyCount}</p>
          </div>
        </div>
      )}

      {/* Results Table & Export */}
      <div className="card" style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>முடிவுகள் (Results)</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={exportToCSV} disabled={data.length === 0} className="btn" style={{ backgroundColor: '#10b981', color: 'white', border: 'none' }}>
              Excel (CSV)
            </button>
            <button onClick={exportToPDF} disabled={data.length === 0} className="btn" style={{ backgroundColor: '#ef4444', color: 'white', border: 'none' }}>
              PDF (Basic)
            </button>
          </div>
        </div>

        {error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : data.length === 0 && !loading ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>தேடப்பட்ட விபரங்களுக்கு அமைவாக எவ்வித தரவுகளும் காணப்படவில்லை.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>பெயர்</th>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>பால்</th>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>வயது</th>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>GN பிரிவு</th>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>குறைபாட்டின் வகை</th>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>தொடர்பு எண்</th>
              </tr>
            </thead>
            <tbody>
              {data.map(person => (
                <tr key={person.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem' }}>{person.fullName}</td>
                  <td style={{ padding: '0.75rem' }}>{person.gender === 'Male' ? 'ஆண்' : person.gender === 'Female' ? 'பெண்' : 'ஏனையவை'}</td>
                  <td style={{ padding: '0.75rem' }}>{person.age}</td>
                  <td style={{ padding: '0.75rem' }}>{person.gnDivision?.name || '-'}</td>
                  <td style={{ padding: '0.75rem' }}>{person.disabilityType?.name || '-'}</td>
                  <td style={{ padding: '0.75rem' }}>{person.phoneNumber || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
