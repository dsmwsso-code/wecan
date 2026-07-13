'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function GalleryManagementPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Upload State
  const [formData, setFormData] = useState({ title: '', description: '', date: '', photoBase64s: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Edit State
  const [editingImage, setEditingImage] = useState(null);
  const [editFormData, setEditFormData] = useState({ title: '', description: '', date: '', photoBase64: '' });
  const [isEditing, setIsEditing] = useState(false);
  const editFileInputRef = useRef(null);

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
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch images.');
    } finally {
      setLoading(false);
    }
  };

  const handleMultipleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    let base64s = [];
    let processed = 0;

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} இன் அளவு 5MB இனை விட அதிகமாக உள்ளது.`);
        processed++;
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        base64s.push(reader.result);
        processed++;
        if (processed === files.length) {
          setFormData(prev => ({ ...prev, photoBase64s: base64s }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        if (editFileInputRef.current) editFileInputRef.current.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFormData({ ...editFormData, photoBase64: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || formData.photoBase64s.length === 0) {
      alert('தலைப்பு மற்றும் குறைந்தது ஒரு புகைப்படமாவது தேவை.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setFormData({ title: '', description: '', date: '', photoBase64s: [] });
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchImages();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert('An error occurred while uploading.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editFormData.title) {
      alert('தலைப்பு கட்டாயம் தேவை.');
      return;
    }

    setIsEditing(true);
    try {
      const res = await fetch(`/api/gallery/${editingImage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });
      const data = await res.json();
      if (data.success) {
        setEditingImage(null);
        fetchImages();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert('An error occurred while updating.');
    } finally {
      setIsEditing(false);
    }
  };

  const openEditModal = (img) => {
    setEditingImage(img);
    setEditFormData({
      title: img.title,
      description: img.description || '',
      date: img.date ? new Date(img.date).toISOString().split('T')[0] : '',
      photoBase64: '' // Empty unless changed
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('இந்தப் புகைப்படத்தை நிச்சயமாக நீக்க விரும்புகிறீர்களா?')) return;
    try {
      const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setImages(images.filter(img => img.id !== id));
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert('Failed to delete image.');
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--primary-blue)' }}>Photo Gallery நிர்வாகம்</h1>
          <p style={{ color: 'var(--text-secondary)' }}>செயற்திட்ட புகைப்படங்களைப் பதிவேற்றம் செய்தல்</p>
        </div>
        <div>
          <Link href="/super-admin" className="btn" style={{ border: '1px solid var(--border-color)' }}>
            பின்னோக்கிச் செல்க
          </Link>
        </div>
      </header>

      {/* Upload Form */}
      {!editingImage && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>புதிய புகைப்படங்களைச் சேர் (Add New Photos)</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>பொதுவான தலைப்பு (Title) *</label>
              <input 
                type="text" 
                required 
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>திகதி (Date)</label>
              <input 
                type="date" 
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>சிறு குறிப்பு (Description)</label>
              <textarea 
                rows="2"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>புகைப்படங்கள் (Photos - Max 5MB each) *</label>
              <input 
                type="file" 
                accept="image/*" 
                multiple
                ref={fileInputRef}
                onChange={handleMultipleImagesChange}
                required 
                style={{ width: '100%', padding: '0.5rem', border: '1px dashed #9ca3af', borderRadius: '4px' }}
              />
              {formData.photoBase64s.length > 0 && (
                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'green' }}>
                  {formData.photoBase64s.length} படங்கள் தெரிவு செய்யப்பட்டுள்ளன.
                </p>
              )}
            </div>
            <div style={{ gridColumn: '1 / -1', textAlign: 'right', marginTop: '1rem' }}>
              <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                {isSubmitting ? 'Uploading...' : 'பதிவேற்றம் செய்க (Upload)'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Form */}
      {editingImage && (
        <div className="card" style={{ marginBottom: '2rem', border: '2px solid var(--primary-blue)' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--primary-blue)' }}>புகைப்படத்தைத் திருத்துக (Edit Photo)</h3>
          <form onSubmit={handleEditSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>தலைப்பு (Title) *</label>
              <input 
                type="text" 
                required 
                value={editFormData.title}
                onChange={e => setEditFormData({ ...editFormData, title: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>திகதி (Date)</label>
              <input 
                type="date" 
                value={editFormData.date}
                onChange={e => setEditFormData({ ...editFormData, date: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>சிறு குறிப்பு (Description)</label>
              <textarea 
                rows="2"
                value={editFormData.description}
                onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>புதிய புகைப்படம் (Photo) - மாற்ற விரும்பினால் மட்டும்</label>
              <input 
                type="file" 
                accept="image/*" 
                ref={editFileInputRef}
                onChange={handleEditImageChange}
                style={{ width: '100%', padding: '0.5rem', border: '1px dashed #9ca3af', borderRadius: '4px' }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" onClick={() => setEditingImage(null)} className="btn" style={{ border: '1px solid #ccc' }}>
                Cancel
              </button>
              <button type="submit" disabled={isEditing} className="btn btn-primary">
                {isEditing ? 'Updating...' : 'Update செய்க'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Gallery List */}
      <div>
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>பதிவேற்றப்பட்ட புகைப்படங்கள் ({images.length})</h3>
        
        {loading ? (
          <p>Loading gallery...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : images.length === 0 ? (
          <p>புகைப்படங்கள் எதுவும் பதிவேற்றப்படவில்லை.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {images.map(img => (
              <div key={img.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'white' }}>
                <img src={img.photoBase64} alt={img.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                <div style={{ padding: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>{img.title}</h4>
                  {img.date && <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#6b7280' }}>{new Date(img.date).toLocaleDateString()}</p>}
                  {img.description && <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{img.description}</p>}
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => openEditModal(img)} className="btn" style={{ flex: 1, backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', padding: '0.5rem' }}>
                      திருத்துக
                    </button>
                    <button onClick={() => handleDelete(img.id)} className="btn" style={{ flex: 1, backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', padding: '0.5rem' }}>
                      நீக்குக
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
