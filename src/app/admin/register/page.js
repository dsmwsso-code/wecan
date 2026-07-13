'use client';

import { useState, useEffect, useRef } from 'react';
import CameraCapture from '@/components/CameraCapture';

export default function RegisterPerson() {
  const predefinedAssistances = [
    "நலன்புரி நன்மைகள் கொடுப்பனவு",
    "விசேட தேவையுடையோருக்கான கொடுப்பனவு",
    "நோய்க் கொடுப்பனவு",
    "பொதுசன மாதாந்த உதவி கொடுப்பனவு (PAMA)"
  ];

  const [formData, setFormData] = useState({
    nic: '',
    fullName: '',
    gender: 'Male',
    dob: '',
    mobileNumber: '',
    gnDivisionId: '',
    address: '',
    disabilityCategoryId: '',
    disabilityTypeId: '',
    occupation: '',
    monthlyIncome: '',
    assistanceReceived: [],
    familyMembers: [],
    equipments: [],
    profilePhotoBase64: ''
  });

  const [gnDivisions, setGnDivisions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Custom Assistance Input State
  const [customAssistance, setCustomAssistance] = useState('');

  // Family Member Input State
  const [familyMemberInput, setFamilyMemberInput] = useState({
    fullName: '',
    dob: '',
    nic: '',
    relationship: '',
    phoneNumber: '',
    occupation: ''
  });
  const [editingFamilyMemberIndex, setEditingFamilyMemberIndex] = useState(null);

  // Equipment Input State
  const [equipmentInput, setEquipmentInput] = useState({
    equipmentName: '',
    receivedYear: ''
  });
  const [editingEquipmentIndex, setEditingEquipmentIndex] = useState(null);

  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    try {
      const [gnRes, catRes, typeRes, userRes] = await Promise.all([
        fetch('/api/master-data?type=GnDivision'),
        fetch('/api/master-data?type=DisabilityCategory'),
        fetch('/api/master-data?type=DisabilityType'),
        fetch('/api/auth/me')
      ]);
      const [gn, cat, typ, user] = await Promise.all([gnRes.json(), catRes.json(), typeRes.json(), userRes.json()]);
      
      if (gn.success) setGnDivisions(gn.data);
      if (cat.success) setCategories(cat.data);
      if (typ.success) setTypes(typ.data);

      if (user.success) {
        setCurrentUser(user.user);
        if (user.user.role === 'ADMIN' && user.user.gnDivisionId) {
          setFormData(prev => ({ ...prev, gnDivisionId: String(user.user.gnDivisionId) }));
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'disabilityCategoryId') {
      setFormData({ ...formData, [name]: value, disabilityTypeId: '' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("புகைப்படம் 5MB இற்கு குறைவாக இருக்க வேண்டும்.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePhotoBase64: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Assistance Received Logic ---
  const toggleAssistance = (value) => {
    setFormData(prev => {
      const exists = prev.assistanceReceived.includes(value);
      if (exists) {
        return { ...prev, assistanceReceived: prev.assistanceReceived.filter(a => a !== value) };
      } else {
        return { ...prev, assistanceReceived: [...prev.assistanceReceived, value] };
      }
    });
  };

  const addCustomAssistance = () => {
    if (customAssistance.trim() !== '') {
      toggleAssistance(customAssistance.trim());
      setCustomAssistance('');
    }
  };

  // --- Family Member Logic ---
  const handleFamilyMemberChange = (e) => {
    setFamilyMemberInput({ ...familyMemberInput, [e.target.name]: e.target.value });
  };

  const addFamilyMember = () => {
    if (!familyMemberInput.fullName || !familyMemberInput.relationship) {
      alert("முழுப் பெயர் மற்றும் உறவுமுறை கட்டாயம் தேவை.");
      return;
    }
    
    if (editingFamilyMemberIndex !== null) {
      // Update existing
      setFormData(prev => {
        const updated = [...prev.familyMembers];
        updated[editingFamilyMemberIndex] = familyMemberInput;
        return { ...prev, familyMembers: updated };
      });
      setEditingFamilyMemberIndex(null);
    } else {
      // Add new
      setFormData(prev => ({
        ...prev,
        familyMembers: [...prev.familyMembers, familyMemberInput]
      }));
    }
    
    setFamilyMemberInput({ fullName: '', dob: '', nic: '', relationship: '', phoneNumber: '', occupation: '' });
  };

  const removeFamilyMember = (index) => {
    setFormData(prev => ({
      ...prev,
      familyMembers: prev.familyMembers.filter((_, i) => i !== index)
    }));
    if (editingFamilyMemberIndex === index) {
      setEditingFamilyMemberIndex(null);
      setFamilyMemberInput({ fullName: '', dob: '', nic: '', relationship: '', phoneNumber: '', occupation: '' });
    }
  };

  const editFamilyMember = (index) => {
    setFamilyMemberInput(formData.familyMembers[index]);
    setEditingFamilyMemberIndex(index);
  };

  // --- Equipment Logic ---
  const handleEquipmentChange = (e) => {
    setEquipmentInput({ ...equipmentInput, [e.target.name]: e.target.value });
  };

  const addEquipment = () => {
    if (!equipmentInput.equipmentName) {
      alert("உபகரணத்தின் பெயர் கட்டாயம் தேவை.");
      return;
    }
    
    if (editingEquipmentIndex !== null) {
      setFormData(prev => {
        const updated = [...prev.equipments];
        updated[editingEquipmentIndex] = equipmentInput;
        return { ...prev, equipments: updated };
      });
      setEditingEquipmentIndex(null);
    } else {
      setFormData(prev => ({
        ...prev,
        equipments: [...prev.equipments, equipmentInput]
      }));
    }
    setEquipmentInput({ equipmentName: '', receivedYear: '' });
  };

  const removeEquipment = (index) => {
    setFormData(prev => ({
      ...prev,
      equipments: prev.equipments.filter((_, i) => i !== index)
    }));
    if (editingEquipmentIndex === index) {
      setEditingEquipmentIndex(null);
      setEquipmentInput({ equipmentName: '', receivedYear: '' });
    }
  };

  const editEquipment = (index) => {
    setEquipmentInput(formData.equipments[index]);
    setEditingEquipmentIndex(index);
  };

  // --- Submit Logic ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    // Prepare payload (convert income to number)
    const payload = {
      ...formData,
      monthlyIncome: formData.monthlyIncome ? parseFloat(formData.monthlyIncome) : null
    };

    try {
      const res = await fetch('/api/persons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus({ 
          type: 'error', 
          message: data.error + (data.details ? ` (Registered in ${data.details.registeredGnDivision} by ${data.details.registeredBy})` : '') 
        });
      } else {
        setStatus({ type: 'success', message: `Successfully registered! Registration No: ${data.data.registrationNumber}` });
        // Reset form
        setFormData({
          nic: '', fullName: '', gender: 'Male', dob: '', mobileNumber: '',
          gnDivisionId: formData.gnDivisionId, address: '', disabilityCategoryId: '', disabilityTypeId: '',
          occupation: '', monthlyIncome: '', assistanceReceived: [], familyMembers: [], equipments: [], profilePhotoBase64: ''
        });
        window.scrollTo(0, 0);
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'An unexpected error occurred.' });
    }
    setLoading(false);
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ color: 'var(--primary-blue)', marginBottom: '1.5rem' }}>விசேட தேவையுடையோர் பதிவு</h1>
      
      {status.message && (
        <div style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          backgroundColor: status.type === 'error' ? '#fee2e2' : '#d1fae5',
          color: status.type === 'error' ? '#991b1b' : '#065f46',
          borderLeft: `4px solid ${status.type === 'error' ? '#ef4444' : '#10b981'}`,
          borderRadius: '4px'
        }}>
          <strong>{status.type === 'error' ? 'எச்சரிக்கை: ' : 'வெற்றி: '}</strong>
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        
        {/* SECTION 1: Personal Info */}
        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary-blue)' }}>1. தனிப்பட்ட விபரங்கள் (Personal Information)</h3>
        
        {/* Profile Photo Upload */}
        <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>புகைப்படம் (Profile Photo)</label>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {formData.profilePhotoBase64 && (
              <div style={{ width: '120px', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '2px solid var(--primary-blue)' }}>
                <img src={formData.profilePhotoBase64} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoUpload} style={{ display: 'none' }} />
              
              <button type="button" onClick={() => setShowCamera(true)} className="btn" style={{ backgroundColor: '#10b981', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>📷</span> புகைப்படம் எடுங்கள் (Take Photo)
              </button>
              
              <button type="button" onClick={() => fileInputRef.current?.click()} className="btn" style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>📁</span> படத்தைப் பதிவேற்றுக (Upload Image)
              </button>
              
              {formData.profilePhotoBase64 && (
                <button type="button" onClick={() => setFormData(prev => ({ ...prev, profilePhotoBase64: '' }))} className="btn" style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                  அகற்றுக (Remove)
                </button>
              )}
            </div>
          </div>
        </div>

        {showCamera && (
          <CameraCapture 
            onCapture={(dataUrl) => {
              setFormData(prev => ({ ...prev, profilePhotoBase64: dataUrl }));
              setShowCamera(false);
            }}
            onCancel={() => setShowCamera(false)}
          />
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <label>தே.அ.அட்டை இலக்கம் (NIC)</label>
            <input type="text" name="nic" value={formData.nic} onChange={handleChange} required style={{ width: '100%' }} />
          </div>
          <div>
            <label>முழுப் பெயர் (Full Name)</label>
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required style={{ width: '100%' }} />
          </div>
          <div>
            <label>பிறந்த திகதி (Date of Birth)</label>
            <input type="date" name="dob" value={formData.dob} onChange={handleChange} required style={{ width: '100%' }} />
          </div>
          <div>
            <label>பாலினம் (Gender)</label>
            <select name="gender" value={formData.gender} onChange={handleChange} style={{ width: '100%' }}>
              <option value="Male">ஆண் (Male)</option>
              <option value="Female">பெண் (Female)</option>
            </select>
          </div>
          <div>
            <label>தொலைபேசி இலக்கம் (Mobile Number)</label>
            <input type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} required style={{ width: '100%' }} />
          </div>
          <div>
            <label>தொழில் (Occupation)</label>
            <input type="text" name="occupation" value={formData.occupation} onChange={handleChange} style={{ width: '100%' }} />
          </div>
          <div>
            <label>குடும்ப மாதாந்த வருமானம் (Monthly Income - Rs.)</label>
            <input type="number" name="monthlyIncome" value={formData.monthlyIncome} onChange={handleChange} min="0" step="0.01" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Assistance Received */}
        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--text-primary)' }}>பண உதவிகள் (Financial Assistance)</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            {predefinedAssistances.map((assistance, index) => (
              <label key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', margin: 0 }}>
                <input 
                  type="checkbox" 
                  checked={formData.assistanceReceived.includes(assistance)}
                  onChange={() => toggleAssistance(assistance)}
                  style={{ width: '1.2rem', height: '1.2rem', margin: 0, flexShrink: 0 }}
                />
                <span style={{ fontSize: '0.95rem', lineHeight: '1.4' }}>{assistance}</span>
              </label>
            ))}
            
            {/* Display manually added items */}
            {formData.assistanceReceived.filter(a => !predefinedAssistances.includes(a)).map((assistance, index) => (
               <label key={`custom-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', margin: 0 }}>
                 <input 
                   type="checkbox" 
                   checked={true}
                   onChange={() => toggleAssistance(assistance)}
                   style={{ width: '1.2rem', height: '1.2rem', margin: 0, flexShrink: 0 }}
                 />
                 <span style={{ fontSize: '0.95rem', lineHeight: '1.4' }}>{assistance}</span>
                 <button type="button" onClick={() => toggleAssistance(assistance)} style={{ color: '#ef4444', fontSize: '0.8rem', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}>(Remove)</button>
               </label>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '600px' }}>
            <input 
              type="text" 
              placeholder="ஏனைய உதவிகள் (Other Assistance)..." 
              value={customAssistance} 
              onChange={(e) => setCustomAssistance(e.target.value)} 
              style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '4px' }} 
            />
            <button type="button" onClick={addCustomAssistance} className="btn" style={{ border: '1px solid var(--primary-blue)', color: 'var(--primary-blue)', padding: '0 1.5rem' }}>
              சேர்க்க (Add)
            </button>
          </div>
        </div>

        {/* Equipment Assistance */}
        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--text-primary)' }}>உபகரண உதவிகள் (Equipment Assistance)</label>
          
          {formData.equipments.length > 0 && (
            <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>உபகரணத்தின் பெயர்</th>
                    <th style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>பெற்றுக்கொண்ட ஆண்டு</th>
                    <th style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>செயற்பாடு</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.equipments.map((eq, index) => (
                    <tr key={index} style={{ backgroundColor: editingEquipmentIndex === index ? '#fef3c7' : 'transparent' }}>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>{eq.equipmentName}</td>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>{eq.receivedYear}</td>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>
                        <button type="button" onClick={() => editEquipment(index)} style={{ color: 'var(--primary-blue)', background: 'none', border: 'none', cursor: 'pointer', marginRight: '0.5rem' }}>தொகு</button>
                        <button type="button" onClick={() => removeEquipment(index)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>நீக்கு</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '1rem', padding: '1rem', backgroundColor: editingEquipmentIndex !== null ? '#fef3c7' : 'white', borderRadius: '4px', border: `1px solid ${editingEquipmentIndex !== null ? '#f59e0b' : '#e5e7eb'}` }}>
            <div><input type="text" name="equipmentName" placeholder="உபகரணத்தின் பெயர் *" value={equipmentInput.equipmentName} onChange={handleEquipmentChange} style={{ width: '100%', padding: '0.5rem' }} /></div>
            <div><input type="text" name="receivedYear" placeholder="ஆண்டு (எ.கா: 2023)" value={equipmentInput.receivedYear} onChange={handleEquipmentChange} style={{ width: '100%', padding: '0.5rem' }} /></div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {editingEquipmentIndex !== null && (
                <button type="button" onClick={() => { setEditingEquipmentIndex(null); setEquipmentInput({ equipmentName: '', receivedYear: '' }); }} className="btn" style={{ border: '1px solid var(--border-color)', backgroundColor: 'transparent' }}>ரத்து</button>
              )}
              <button type="button" onClick={addEquipment} className="btn" style={{ backgroundColor: editingEquipmentIndex !== null ? '#f59e0b' : '#10b981', color: 'white', border: 'none' }}>
                {editingEquipmentIndex !== null ? 'சேமி' : '+ சேர்'}
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 2: Address */}
        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary-blue)' }}>2. முகவரி விபரங்கள் (Address Information)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <label>கிராம உத்தியோகத்தர் பிரிவு (GN Division)</label>
            <select 
              name="gnDivisionId" 
              value={formData.gnDivisionId} 
              onChange={handleChange} 
              required
              disabled={currentUser?.role === 'ADMIN'}
              style={{ width: '100%', backgroundColor: currentUser?.role === 'ADMIN' ? '#f3f4f6' : 'transparent' }}
            >
              <option value="">-- தெரிவு செய்க --</option>
              {gnDivisions.map(gn => <option key={gn.id} value={gn.id}>MN/{gn.id} - {gn.name}</option>)}
            </select>
          </div>
          <div>
            <label>முகவரி (Address)</label>
            <textarea name="address" value={formData.address} onChange={handleChange} rows="2" required style={{ width: '100%' }}></textarea>
          </div>
        </div>

        {/* SECTION 3: Disability */}
        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary-blue)' }}>3. குறைபாடு தொடர்பான விபரங்கள் (Disability Information)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <label>குறைபாட்டின் வகை (Disability Category)</label>
            <select name="disabilityCategoryId" value={formData.disabilityCategoryId} onChange={handleChange} required style={{ width: '100%' }}>
              <option value="">-- தெரிவு செய்க --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label>குறைபாட்டின் தன்மை (Disability Type)</label>
            <select name="disabilityTypeId" value={formData.disabilityTypeId} onChange={handleChange} required style={{ width: '100%' }}>
              <option value="">-- தெரிவு செய்க --</option>
              {types
                .filter(t => !formData.disabilityCategoryId || t.categoryId === parseInt(formData.disabilityCategoryId))
                .map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>

        {/* SECTION 4: Family Members */}
        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', color: 'var(--primary-blue)' }}>4. குடும்ப அங்கத்தவர் விபரங்கள் (Family Members)</h3>
        <div style={{ marginBottom: '2rem' }}>
          {/* Family Member Table */}
          {formData.familyMembers.length > 0 && (
            <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', border: '1px solid #e5e7eb' }}>
                <thead style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <th style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>முழுப் பெயர்</th>
                    <th style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>பிறந்த திகதி</th>
                    <th style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>அ.அ. இலக்கம்</th>
                    <th style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>உறவுமுறை</th>
                    <th style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>தொலைபேசி</th>
                    <th style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>தொழில்</th>
                    <th style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>செயற்பாடு</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.familyMembers.map((member, index) => (
                    <tr key={index} style={{ backgroundColor: editingFamilyMemberIndex === index ? '#fef3c7' : 'transparent' }}>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>{member.fullName}</td>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>{member.dob}</td>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>{member.nic}</td>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>{member.relationship}</td>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>{member.phoneNumber}</td>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>{member.occupation}</td>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>
                        <button type="button" onClick={() => editFamilyMember(index)} style={{ color: 'var(--primary-blue)', background: 'none', border: 'none', cursor: 'pointer', marginRight: '0.5rem' }}>தொகு</button>
                        <button type="button" onClick={() => removeFamilyMember(index)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>நீக்கு</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add Member Form */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', padding: '1rem', backgroundColor: editingFamilyMemberIndex !== null ? '#fef3c7' : '#f9fafb', borderRadius: '4px', border: `1px solid ${editingFamilyMemberIndex !== null ? '#f59e0b' : '#e5e7eb'}` }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <strong>{editingFamilyMemberIndex !== null ? 'உறுப்பினரைத் திருத்துக (Edit Member)' : 'புதிய உறுப்பினரைச் சேர்க்க (Add New Member)'}</strong>
            </div>
            <div><input type="text" name="fullName" placeholder="முழுப் பெயர் *" value={familyMemberInput.fullName} onChange={handleFamilyMemberChange} style={{ width: '100%', padding: '0.5rem' }} /></div>
            <div><input type="date" name="dob" placeholder="பிறந்த திகதி" value={familyMemberInput.dob} onChange={handleFamilyMemberChange} style={{ width: '100%', padding: '0.5rem' }} /></div>
            <div><input type="text" name="nic" placeholder="அடையாள அட்டை இலக்கம்" value={familyMemberInput.nic} onChange={handleFamilyMemberChange} style={{ width: '100%', padding: '0.5rem' }} /></div>
            <div>
              <select name="relationship" value={familyMemberInput.relationship} onChange={handleFamilyMemberChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                <option value="">-- உறவுமுறை * --</option>
                {['தந்தை', 'தாய்', 'கணவன்', 'மனைவி', 'மகன்', 'மகள்', 'பேரன்', 'பேர்த்தி', 'மாமா', 'மாமி', 'பெரியம்மா', 'பெரியப்பா', 'சித்தப்பா', 'சித்தி', 'ஏனையவை'].map(rel => (
                  <option key={rel} value={rel}>{rel}</option>
                ))}
              </select>
            </div>
            <div><input type="text" name="phoneNumber" placeholder="தொலைபேசி இலக்கம்" value={familyMemberInput.phoneNumber} onChange={handleFamilyMemberChange} style={{ width: '100%', padding: '0.5rem' }} /></div>
            <div><input type="text" name="occupation" placeholder="தொழில்" value={familyMemberInput.occupation} onChange={handleFamilyMemberChange} style={{ width: '100%', padding: '0.5rem' }} /></div>
            <div style={{ gridColumn: '1 / -1', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              {editingFamilyMemberIndex !== null && (
                <button type="button" onClick={() => { setEditingFamilyMemberIndex(null); setFamilyMemberInput({ fullName: '', dob: '', nic: '', relationship: '', phoneNumber: '', occupation: '' }); }} className="btn" style={{ border: '1px solid var(--border-color)', backgroundColor: 'transparent' }}>ரத்து செய்க</button>
              )}
              <button type="button" onClick={addFamilyMember} className="btn" style={{ backgroundColor: editingFamilyMemberIndex !== null ? '#f59e0b' : '#10b981', color: 'white', border: 'none' }}>
                {editingFamilyMemberIndex !== null ? 'மாற்றங்களைச் சேமி (Save)' : '+ உறுப்பினரைச் சேர் (Add Member)'}
              </button>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '1rem 3rem', fontSize: '1.2rem', width: '100%', maxWidth: '400px' }}>
            {loading ? 'சேமிக்கப்படுகிறது...' : 'பதிவு செய்க'}
          </button>
        </div>
      </form>
    </div>
  );
}
