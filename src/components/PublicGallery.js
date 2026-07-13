'use client';

import { useState, useEffect } from 'react';

// Helpers to get month name and year
const getMonthName = (monthIndex) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[monthIndex];
};

export default function PublicGallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Navigation State
  // Possible views: 
  // - 'dashboard' (shows current month EVENTS + past months + past years)
  // - { type: 'year', year: 2025 } (shows months inside that year)
  // - { type: 'month', year: 2025, month: 10 } (shows events inside that month)
  // - { type: 'event', year: 2025, month: 10, title: 'Annual Meeting' } (shows photos inside that event)
  const [currentView, setCurrentView] = useState('dashboard');

  // Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [lightboxImages, setLightboxImages] = useState([]);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const res = await fetch('/api/gallery');
      const data = await res.json();
      if (data.success) {
        setImages(data.data);
      } else {
        setError('படங்களைப் பெற முடியவில்லை.');
      }
    } catch (err) {
      setError('Server Error.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p style={{ textAlign: 'center', padding: '2rem' }}>Loading Gallery...</p>;
  if (error) return <p style={{ textAlign: 'center', color: 'red' }}>{error}</p>;
  if (images.length === 0) return null;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11

  // Process images into groups: Year -> Month -> Title (Event)
  const grouped = {};
  
  images.forEach(img => {
    const d = img.date ? new Date(img.date) : new Date();
    const y = d.getFullYear();
    const m = d.getMonth();
    const title = img.title || 'Other';

    if (!grouped[y]) grouped[y] = {};
    if (!grouped[y][m]) grouped[y][m] = {};
    if (!grouped[y][m][title]) grouped[y][m][title] = [];
    
    grouped[y][m][title].push(img);
  });

  // Lightbox functions
  const openLightbox = (imgList, index) => {
    setLightboxImages(imgList);
    setLightboxIndex(index);
    document.body.style.overflow = 'hidden'; // prevent scrolling
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
    setLightboxImages([]);
    document.body.style.overflow = 'auto';
  };

  const nextLightbox = () => {
    setLightboxIndex((prev) => (prev + 1) % lightboxImages.length);
  };

  const prevLightbox = () => {
    setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length);
  };

  // Render Image Card (Photos only, no text)
  const renderImageCard = (img, imgList, index) => (
    <div key={img.id} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} onClick={() => openLightbox(imgList, index)}>
      <img src={img.photoBase64} alt={img.title} style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }} />
    </div>
  );

  // Render Album Card
  const renderAlbumCard = (title, subtitle, coverImageBase64, onClick) => (
    <div key={title} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }} onClick={onClick}>
      <div style={{ height: '200px', backgroundColor: '#e5e7eb', position: 'relative' }}>
        {coverImageBase64 ? (
          <img src={coverImageBase64} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <span style={{ fontSize: '3rem', color: '#9ca3af' }}>📁</span>
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1rem', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
          <h3 style={{ margin: 0, color: 'white', fontSize: '1.2rem' }}>{title}</h3>
          {subtitle && <p style={{ margin: '0.2rem 0 0 0', color: '#d1d5db', fontSize: '0.9rem' }}>{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  // VIEWS
  let content;

  if (currentView === 'dashboard') {
    const currentMonthData = (grouped[currentYear] && grouped[currentYear][currentMonth]) || {};
    const currentMonthEventTitles = Object.keys(currentMonthData);
    
    // Past Months in Current Year
    const pastMonthsCurrentYear = [];
    if (grouped[currentYear]) {
      Object.keys(grouped[currentYear]).sort((a,b) => b - a).forEach(m => {
        if (parseInt(m) !== currentMonth) {
          pastMonthsCurrentYear.push(parseInt(m));
        }
      });
    }

    // Past Years
    const pastYears = Object.keys(grouped).filter(y => parseInt(y) !== currentYear).sort((a,b) => b - a);

    content = (
      <div>
        {currentMonthEventTitles.length > 0 && (
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'var(--primary-blue)', marginBottom: '1.5rem', borderBottom: '2px solid var(--primary-blue)', paddingBottom: '0.5rem', display: 'inline-block' }}>இம்மாத நிகழ்வுகள் (This Month's Events)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {currentMonthEventTitles.map(title => {
                const eventPhotos = currentMonthData[title];
                const cover = eventPhotos[0]?.photoBase64;
                return renderAlbumCard(
                  title, 
                  `${eventPhotos.length} Photos`, 
                  cover, 
                  () => setCurrentView({ type: 'event', year: currentYear, month: currentMonth, title: title })
                );
              })}
            </div>
          </div>
        )}

        {(pastMonthsCurrentYear.length > 0 || pastYears.length > 0) && (
          <div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', borderBottom: '2px solid #d1d5db', paddingBottom: '0.5rem', display: 'inline-block' }}>Albums</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
              {pastMonthsCurrentYear.map(m => {
                const monthEvents = grouped[currentYear][m];
                let totalPhotos = 0;
                let cover = null;
                Object.values(monthEvents).forEach(eventPhotos => {
                  totalPhotos += eventPhotos.length;
                  if (!cover && eventPhotos.length > 0) cover = eventPhotos[0].photoBase64;
                });
                
                return renderAlbumCard(
                  `${getMonthName(m)} ${currentYear}`, 
                  `${totalPhotos} Photos`, 
                  cover, 
                  () => setCurrentView({ type: 'month', year: currentYear, month: m })
                );
              })}

              {pastYears.map(y => {
                let cover = null;
                let totalPhotos = 0;
                Object.values(grouped[y]).forEach(monthEvents => {
                  Object.values(monthEvents).forEach(eventPhotos => {
                    totalPhotos += eventPhotos.length;
                    if (!cover && eventPhotos.length > 0) cover = eventPhotos[0].photoBase64;
                  });
                });
                return renderAlbumCard(
                  `${y} Albums`, 
                  `${totalPhotos} Photos`, 
                  cover, 
                  () => setCurrentView({ type: 'year', year: parseInt(y) })
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  } else if (currentView.type === 'year') {
    const y = currentView.year;
    const months = Object.keys(grouped[y] || {}).sort((a,b) => b - a);

    content = (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
          <button onClick={() => setCurrentView('dashboard')} className="btn" style={{ marginRight: '1rem', border: '1px solid #ccc' }}>&larr; Back</button>
          <h2 style={{ color: 'var(--primary-blue)', margin: 0 }}>{y} Albums</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {months.map(m => {
            const monthEvents = grouped[y][m];
            let totalPhotos = 0;
            let cover = null;
            Object.values(monthEvents).forEach(eventPhotos => {
              totalPhotos += eventPhotos.length;
              if (!cover && eventPhotos.length > 0) cover = eventPhotos[0].photoBase64;
            });
            
            return renderAlbumCard(
              `${getMonthName(m)} ${y}`, 
              `${totalPhotos} Photos`, 
              cover, 
              () => setCurrentView({ type: 'month', year: y, month: parseInt(m) })
            );
          })}
        </div>
      </div>
    );
  } else if (currentView.type === 'month') {
    const y = currentView.year;
    const m = currentView.month;
    const monthData = (grouped[y] && grouped[y][m]) || {};
    const eventTitles = Object.keys(monthData);

    content = (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
          <button onClick={() => setCurrentView(y === currentYear ? 'dashboard' : { type: 'year', year: y })} className="btn" style={{ marginRight: '1rem', border: '1px solid #ccc' }}>&larr; Back</button>
          <h2 style={{ color: 'var(--primary-blue)', margin: 0 }}>{getMonthName(m)} {y} Events</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {eventTitles.map(title => {
            const eventPhotos = monthData[title];
            const cover = eventPhotos[0]?.photoBase64;
            return renderAlbumCard(
              title, 
              `${eventPhotos.length} Photos`, 
              cover, 
              () => setCurrentView({ type: 'event', year: y, month: m, title: title })
            );
          })}
        </div>
      </div>
    );
  } else if (currentView.type === 'event') {
    const y = currentView.year;
    const m = currentView.month;
    const title = currentView.title;
    const eventImages = (grouped[y] && grouped[y][m] && grouped[y][m][title]) || [];
    
    const eventDescription = eventImages[0]?.description;
    const eventDate = eventImages[0]?.date ? new Date(eventImages[0].date).toLocaleDateString() : '';

    content = (
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <button onClick={() => setCurrentView(y === currentYear && m === currentMonth ? 'dashboard' : { type: 'month', year: y, month: m })} className="btn" style={{ marginRight: '1rem', border: '1px solid #ccc', marginTop: '0.5rem' }}>&larr; Back</button>
          <div>
            <h2 style={{ color: 'var(--primary-blue)', margin: '0 0 0.5rem 0', fontSize: '1.8rem' }}>{title}</h2>
            {eventDate && <p style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#4b5563', fontWeight: 'bold' }}>{eventDate}</p>}
            {eventDescription && <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-secondary)' }}>{eventDescription}</p>}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {eventImages.map((img, idx) => renderImageCard(img, eventImages, idx))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      {content}

      {/* Lightbox */}
      {lightboxIndex !== null && lightboxImages.length > 0 && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          {/* Close Button */}
          <button 
            onClick={closeLightbox}
            style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer' }}
          >
            &times;
          </button>

          {/* Navigation */}
          {lightboxImages.length > 1 && (
            <>
              <button onClick={prevLightbox} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: '2rem', padding: '1rem', cursor: 'pointer', borderRadius: '50%' }}>
                &#10094;
              </button>
              <button onClick={nextLightbox} style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: '2rem', padding: '1rem', cursor: 'pointer', borderRadius: '50%' }}>
                &#10095;
              </button>
            </>
          )}

          {/* Image */}
          <img 
            src={lightboxImages[lightboxIndex].photoBase64} 
            alt={lightboxImages[lightboxIndex].title} 
            style={{ maxHeight: '80vh', maxWidth: '90vw', objectFit: 'contain' }} 
          />

          {/* Info */}
          <div style={{ color: 'white', textAlign: 'center', marginTop: '1rem', maxWidth: '800px', padding: '0 1rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>{lightboxImages[lightboxIndex].title}</h3>
            {lightboxImages[lightboxIndex].description && <p style={{ margin: '0 0 0.5rem 0', color: '#d1d5db' }}>{lightboxImages[lightboxIndex].description}</p>}
            {lightboxImages[lightboxIndex].date && <p style={{ margin: 0, fontSize: '0.9rem', color: '#9ca3af' }}>{new Date(lightboxImages[lightboxIndex].date).toLocaleDateString()}</p>}
            <p style={{ margin: '1rem 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
              {lightboxIndex + 1} / {lightboxImages.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
