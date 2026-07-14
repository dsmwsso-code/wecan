'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import MultiSelect from '@/components/MultiSelect';

export default function ReportsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const availableColumns = [
    { id: 'serialNo', label: 'தொடர் இல.' },
    { id: 'fullName', label: 'பெயர்' },
    { id: 'nic', label: 'அடையாள அட்டை இல.' },
    { id: 'gender', label: 'பால்' },
    { id: 'age', label: 'வயது' },
    { id: 'gnDivision', label: 'GN பிரிவு' },
    { id: 'village', label: 'கிராமம்' },
    { id: 'address', label: 'முகவரி' },
    { id: 'mobileNumber', label: 'தொலைபேசி இல.' },
    { id: 'disabilityCategory', label: 'குறைபாட்டின் வகை (Category)' },
    { id: 'disabilityType', label: 'குறைபாட்டின் தன்மை (Type)' },
    { id: 'disabilityPercentage', label: 'பாதிப்பு சதவீதம்' },
    { id: 'causeOfDisability', label: 'குறைபாட்டிற்கான காரணம்' },
    { id: 'educationLevel', label: 'கல்வி தகுதி' },
    { id: 'employmentStatus', label: 'தொழில் நிலை' },
    { id: 'occupation', label: 'தொழில்' },
    { id: 'monthlyIncome', label: 'மாத வருமானம்' },
    { id: 'assistances', label: 'பெற்ற உதவிகள்' },
    { id: 'equipments', label: 'உபகரணங்கள்' }
  ];

  const [selectedColumns, setSelectedColumns] = useState([
    'serialNo', 'fullName', 'gnDivision', 'mobileNumber', 'nic', 'disabilityType', 'age'
  ]);

  const handleColumnToggle = (colId) => {
    setSelectedColumns(prev => 
      prev.includes(colId) ? prev.filter(c => c !== colId) : [...prev, colId]
    );
  };

  
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
    
    // Header row based on selected columns
    const headers = selectedColumns.map(colId => availableColumns.find(c => c.id === colId)?.label || '');
    
    // Data rows
    const rows = data.map((person, index) => {
      return selectedColumns.map(colId => {
        switch(colId) {
          case 'serialNo': return index + 1;
          case 'fullName': return person.fullName;
          case 'nic': return person.nic;
          case 'gender': return person.gender === 'Male' ? 'ஆண்' : person.gender === 'Female' ? 'பெண்' : 'ஏனையவை';
          case 'age': return person.age;
          case 'gnDivision': return person.gnDivision?.name || '-';
          case 'village': return person.village?.name || '-';
          case 'address': return `"${(person.address || '').replace(/"/g, '""')}"`;
          case 'mobileNumber': return person.mobileNumber || '-';
          case 'disabilityCategory': return person.disabilityCategory?.name || '-';
          case 'disabilityType': return person.disabilityType?.name || '-';
          case 'disabilityPercentage': return person.disabilityPercentage ? `${person.disabilityPercentage}%` : '-';
          case 'causeOfDisability': return person.causeOfDisability || '-';
          case 'educationLevel': return person.educationLevel?.name || '-';
          case 'employmentStatus': return person.employmentStatus?.name || '-';
          case 'occupation': return person.occupation || '-';
          case 'monthlyIncome': return person.monthlyIncome || '-';
          case 'assistances': 
            const aList = person.assistances ? person.assistances.map(a => a.assistanceType?.name) : [];
            return `"${aList.join(', ')}"`;
          case 'equipments': 
            const eList = person.equipments ? person.equipments.map(e => e.equipmentName) : [];
            return `"${eList.join(', ')}"`;
          default: return '-';
        }
      });
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `DPIMS_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };


  const exportToPDF = async () => {
    const element = document.getElementById('report-container');
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
      filename: `wecan_report_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: selectedColumns.length > 8 ? 'a3' : 'a4', orientation: 'landscape' }
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
      selectedColumns.forEach(colId => {
        const label = availableColumns.find(c => c.id === colId)?.label;
        let value = '-';
        switch(colId) {
          case 'serialNo': value = index + 1; break;
          case 'fullName': value = p.fullName; break;
          case 'nic': value = p.nic; break;
          case 'gender': value = p.gender === 'Male' ? 'ஆண்' : p.gender === 'Female' ? 'பெண்' : 'ஏனையவை'; break;
          case 'age': value = p.age; break;
          case 'gnDivision': value = p.gnDivision?.name || '-'; break;
          case 'village': value = p.village?.name || '-'; break;
          case 'address': value = p.address || '-'; break;
          case 'mobileNumber': value = p.mobileNumber || '-'; break;
          case 'disabilityCategory': value = p.disabilityCategory?.name || '-'; break;
          case 'disabilityType': value = p.disabilityType?.name || '-'; break;
          case 'disabilityPercentage': value = p.disabilityPercentage ? `${p.disabilityPercentage}%` : '-'; break;
          case 'causeOfDisability': value = p.causeOfDisability || '-'; break;
          case 'educationLevel': value = p.educationLevel?.name || '-'; break;
          case 'employmentStatus': value = p.employmentStatus?.name || '-'; break;
          case 'occupation': value = p.occupation || '-'; break;
          case 'monthlyIncome': value = p.monthlyIncome || '-'; break;
          case 'assistances': 
            const aList = p.assistances ? p.assistances.map(a => a.assistanceType?.name) : [];
            value = aList.join(', ') || '-'; break;
          case 'equipments': 
            const eList = p.equipments ? p.equipments.map(e => e.equipmentName) : [];
            value = eList.join(', ') || '-'; break;
        }
        if (colId === 'serialNo') text += `*${value}. `;
        else if (colId === 'fullName') text += `${value}*\n`;
        else text += `${label}: ${value}\n`;
      });
      text += '\n';
    });

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
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

      
      {/* Column Selection */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary-blue)' }}>அறிக்கையில் இடம்பெற வேண்டிய விபரங்களைத் தெரிவு செய்க (Select Columns)</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          {availableColumns.map(col => (
            <label key={col.id} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              fontSize: '0.9rem', 
              cursor: 'pointer',
              backgroundColor: '#f3f4f6',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              border: selectedColumns.includes(col.id) ? '1px solid #3b82f6' : '1px solid transparent',
              transition: 'all 0.2s ease'
            }}>
              <input 
                type="checkbox" 
                checked={selectedColumns.includes(col.id)}
                onChange={() => handleColumnToggle(col.id)}
                style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#3b82f6' }}
              />
              {col.label}
            </label>
          ))}
        </div>
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
      <div className="card" style={{ overflowX: 'auto' }} id="report-container">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', display: 'none' }} id="pdf-header">
          <h3>Disabled Persons Information Management System (DPIMS)</h3>
          <p>Report Generated On: {new Date().toLocaleDateString()}</p>
        </div>

        <div data-html2canvas-ignore="true" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>முடிவுகள் (Results)</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={shareWhatsApp} disabled={data.length === 0} className="btn" style={{ backgroundColor: '#16a34a', color: 'white', border: 'none' }}>
              WhatsApp இல் பகிர்க
            </button>
            <button onClick={exportToCSV} disabled={data.length === 0} className="btn" style={{ backgroundColor: '#10b981', color: 'white', border: 'none' }}>
              Excel (CSV)
            </button>
            <button onClick={exportToPDF} disabled={data.length === 0} className="btn" style={{ backgroundColor: '#ef4444', color: 'white', border: 'none' }}>
              PDF
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
                {selectedColumns.map(colId => (
                  <th key={colId} style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                    {availableColumns.find(c => c.id === colId)?.label}
                  </th>
                ))}
              </tr>
            </thead>

            
            <tbody>
              {data.map((person, index) => (
                <tr key={person.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  {selectedColumns.map(colId => {
                    let value = '-';
                    switch(colId) {
                      case 'serialNo': value = index + 1; break;
                      case 'fullName': value = person.fullName; break;
                      case 'nic': value = person.nic; break;
                      case 'gender': value = person.gender === 'Male' ? 'ஆண்' : person.gender === 'Female' ? 'பெண்' : 'ஏனையவை'; break;
                      case 'age': value = person.age; break;
                      case 'gnDivision': value = person.gnDivision?.name || '-'; break;
                      case 'village': value = person.village?.name || '-'; break;
                      case 'address': value = person.address || '-'; break;
                      case 'mobileNumber': value = person.mobileNumber || '-'; break;
                      case 'disabilityCategory': value = person.disabilityCategory?.name || '-'; break;
                      case 'disabilityType': value = person.disabilityType?.name || '-'; break;
                      case 'disabilityPercentage': value = person.disabilityPercentage ? `${person.disabilityPercentage}%` : '-'; break;
                      case 'causeOfDisability': value = person.causeOfDisability || '-'; break;
                      case 'educationLevel': value = person.educationLevel?.name || '-'; break;
                      case 'employmentStatus': value = person.employmentStatus?.name || '-'; break;
                      case 'occupation': value = person.occupation || '-'; break;
                      case 'monthlyIncome': value = person.monthlyIncome || '-'; break;
                      case 'assistances': 
                        const aList = person.assistances ? person.assistances.map(a => a.assistanceType?.name) : [];
                        value = aList.join(', ') || '-'; break;
                      case 'equipments': 
                        const eList = person.equipments ? person.equipments.map(e => e.equipmentName) : [];
                        value = eList.join(', ') || '-'; break;
                    }
                    return <td key={colId} style={{ padding: '0.75rem' }}>{value}</td>;
                  })}
                </tr>
              ))}
            </tbody>

          </table>
        )}
      </div>

    </div>
  );
}
