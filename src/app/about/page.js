'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AboutUsPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
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

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ color: 'var(--primary-blue)', fontSize: '2.5rem', marginBottom: '1rem' }}>எம்மைப்பற்றி (About Us)</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
          விசேட தேவையுடையோருக்கான எமது அமைப்பின் (Wecan) சேவைகளை முன்னெடுத்துச் செல்லும் நிர்வாகக் குழுவினர் பற்றிய விபரங்கள்.
        </p>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>தரவுகள் ஏற்றப்படுகின்றன...</p>
        </div>
      ) : members.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>நிர்வாகிகளின் விபரங்கள் இன்னும் இணைக்கப்படவில்லை.</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '2rem',
          maxWidth: '1000px',
          margin: '0 auto'
        }}>
          {members.map((m) => (
            <div key={m.id} className="card" style={{ 
              textAlign: 'center', 
              padding: '2.5rem 1.5rem', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}>
              <div style={{ 
                width: '120px', 
                height: '120px', 
                borderRadius: '50%', 
                overflow: 'hidden',
                marginBottom: '1.5rem',
                border: '4px solid #f3f4f6',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}>
                {m.photoBase64 ? (
                  <img src={m.photoBase64} alt={m.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#9ca3af' }}>
                    {m.fullName.charAt(0)}
                  </div>
                )}
              </div>
              
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{m.fullName}</h2>
              <div style={{ 
                backgroundColor: '#e0e7ff', 
                color: 'var(--primary-blue)', 
                padding: '0.25rem 1rem', 
                borderRadius: '9999px',
                fontSize: '0.9rem',
                fontWeight: '600',
                marginBottom: '1rem'
              }}>
                {m.role}
              </div>
              <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                {m.phoneNumber}
              </p>
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <Link href="/" className="btn" style={{ border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          &larr; பொதுப் புள்ளிவிவரங்களுக்குத் திரும்புக
        </Link>
      </div>
    </div>
  );
}
