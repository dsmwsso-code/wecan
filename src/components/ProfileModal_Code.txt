'use client';

import { useState, useEffect } from 'react';

export default function ProfileModal({ personId, onClose }) {
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (personId) {
      fetchPersonDetails();
    }
  }, [personId]);

  const fetchPersonDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/persons/${personId}`);
      const data = await res.json();
      
      if (res.ok) {
        setPerson(data.data);
      } else {
        setError(data.error || 'Failed to fetch details');
      }
    } catch (err) {
      setError('An error occurred while fetching details');
    } finally {
      setLoading(false);
    }
  };

  if (!personId) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle} className="card">
        <div style={headerStyle}>
          <h2 style={{ margin: 0 }}>முழுமையான விபரங்கள் (Full Profile)</h2>
          <button onClick={onClose} style={closeBtnStyle}>&times;</button>
        </div>

        <div style={contentStyle}>
          {loading ? (
            <p style={{ textAlign: 'center', padding: '2rem' }}>தரவுகள் ஏற்றப்படுகின்றன...</p>
          ) : error ? (
            <p style={{ color: 'red', textAlign: 'center', padding: '2rem' }}>{error}</p>
          ) : person ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
              
              <Section title="அடிப்படை விபரங்கள் (Basic Info)">
                {person.profilePhotoBase64 && (
                  <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    <img 
                      src={person.profilePhotoBase64} 
                      alt="Profile Photo" 
                      style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px', border: '3px solid #e5e7eb' }} 
                    />
                  </div>
                )}
                <InfoRow label="பதிவு இலக்கம்" value={person.registrationNumber} />
                <InfoRow label="தே.அ.அ (NIC)" value={person.nic} />
                <InfoRow label="முழுப் பெயர்" value={person.fullName} />
                <InfoRow label="பெயர் முதலெழுத்துக்களுடன்" value={person.nameWithInitials} />
                <InfoRow label="பாலினம்" value={person.gender} />
                <InfoRow label="பிறந்த திகதி" value={new Date(person.dob).toLocaleDateString()} />
                <InfoRow label="வயது" value={person.age} />
                <InfoRow label="சிவில் நிலை" value={person.maritalStatus?.name} />
                <InfoRow label="தொலைபேசி இலக்கம்" value={person.mobileNumber} />
              </Section>

              <Section title="முகவரி விபரங்கள் (Address Info)">
                <InfoRow label="கிராம உத்தியோகத்தர் பிரிவு" value={person.gnDivision?.name} />
                <InfoRow label="கிராமம்" value={person.village?.name} />
                <InfoRow label="முகவரி" value={person.address} />
              </Section>

              <Section title="குறைபாடு விபரங்கள் (Disability Info)">
                <InfoRow label="குறைபாட்டின் வகை" value={person.disabilityCategory?.name} />
                <InfoRow label="குறைபாட்டின் தன்மை" value={person.disabilityType?.name} />
                <InfoRow label="குறைபாட்டின் வீதம் (%)" value={person.disabilityPercentage ? `${person.disabilityPercentage}%` : '-'} />
                <InfoRow label="குறைபாட்டிற்கான காரணம்" value={person.causeOfDisability} />
                <InfoRow label="குறைபாடு ஏற்பட்ட திகதி" value={person.disabilityStartDate ? new Date(person.disabilityStartDate).toLocaleDateString() : '-'} />
              </Section>

              <Section title="குடும்ப உறுப்பினர்கள் (Family Members)">
                {person.familyMembers && person.familyMembers.length > 0 ? (
                  <table style={tableStyle}>
                    <thead>
                      <tr style={{ backgroundColor: '#f3f4f6', textAlign: 'left' }}>
                        <th style={thStyle}>பெயர்</th>
                        <th style={thStyle}>உறவுமுறை</th>
                        <th style={thStyle}>தொழில்</th>
                      </tr>
                    </thead>
                    <tbody>
                      {person.familyMembers.map(member => (
                        <tr key={member.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={tdStyle}>{member.fullName}</td>
                          <td style={tdStyle}>{member.relationship}</td>
                          <td style={tdStyle}>{member.occupation || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ color: 'var(--text-secondary)' }}>குடும்ப உறுப்பினர் விபரங்கள் இல்லை.</p>
                )}
              </Section>

              <Section title="கல்வி மற்றும் தொழில் (Education & Employment)">
                <InfoRow label="கல்வி நிலை" value={person.educationLevel?.name} />
                <InfoRow label="பாடசாலை" value={person.schoolAttended} />
                <InfoRow label="தொழில் நிலை" value={person.employmentStatus?.name} />
                <InfoRow label="தொழில்" value={person.occupation} />
                <InfoRow label="மாதாந்த வருமானம்" value={person.monthlyIncome ? `Rs. ${person.monthlyIncome}` : '-'} />
              </Section>

              <Section title="பெற்றுக்கொண்ட உதவிகள் (Assistances Received)">
                <InfoRow label="உதவி உபகரணங்கள்" value={person.equipments?.map(e => e.equipmentName).join(', ') || '-'} />
                <InfoRow label="ஏனைய உதவிகள்" value={person.assistances?.map(a => a.assistanceType?.name).join(', ') || '-'} />
              </Section>
              
              <div style={{ marginTop: '1rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem', fontSize: '0.85rem', color: '#6b7280' }}>
                <p>பதிவு செய்தவர்: {person.registeredBy?.username}</p>
                <p>பதிவு செய்யப்பட்ட திகதி: {new Date(person.registeredAt).toLocaleString()}</p>
              </div>

            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Subcomponents for styling
const Section = ({ title, children }) => (
  <div style={{ backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
    <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--primary-blue)', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>{title}</h3>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
      {children}
    </div>
  </div>
);

const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
    <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: '500' }}>{label}</span>
    <span style={{ fontSize: '1rem', color: '#111827', wordBreak: 'break-word' }}>{value || '-'}</span>
  </div>
);

// Styles
const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  padding: '2rem 1rem',
  zIndex: 1000,
  overflowY: 'auto'
};

const modalStyle = {
  width: '100%',
  maxWidth: '800px',
  backgroundColor: 'white',
  borderRadius: '12px',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  maxHeight: '90vh',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1.5rem',
  borderBottom: '1px solid #e5e7eb',
  backgroundColor: 'white',
  position: 'sticky',
  top: 0,
  zIndex: 10
};

const closeBtnStyle = {
  background: 'none',
  border: 'none',
  fontSize: '1.5rem',
  cursor: 'pointer',
  padding: '0.5rem',
  color: '#6b7280',
  lineHeight: 1
};

const contentStyle = {
  padding: '1.5rem',
  overflowY: 'auto',
  backgroundColor: 'white'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: '0.5rem'
};

const thStyle = {
  padding: '0.75rem',
  fontWeight: '600',
  color: '#374151',
  borderBottom: '2px solid #e5e7eb'
};

const tdStyle = {
  padding: '0.75rem',
  color: '#111827'
};
