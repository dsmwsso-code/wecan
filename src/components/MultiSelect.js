'use client';

import { useState, useRef, useEffect } from 'react';

export default function MultiSelect({ options, selectedValues, onChange, placeholder = "அனைத்தும்" }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const toggleSelection = (value) => {
    let newSelected;
    if (selectedValues.includes(value)) {
      newSelected = selectedValues.filter(v => v !== value);
    } else {
      newSelected = [...selectedValues, value];
    }
    onChange(newSelected);
  };

  const isAllSelected = selectedValues.length === 0;

  const handleSelectAll = () => {
    onChange([]); // Empty means "All"
  };

  // Determine display text
  let displayText = placeholder;
  if (selectedValues.length > 0) {
    if (selectedValues.length === 1) {
      const opt = options.find(o => o.value === selectedValues[0]);
      displayText = opt ? opt.label : placeholder;
    } else {
      displayText = `${selectedValues.length} தெரிவு செய்யப்பட்டுள்ளது`;
    }
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          padding: '0.5rem',
          backgroundColor: 'white',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span style={{ fontSize: '0.9rem', color: isAllSelected ? '#6b7280' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {displayText}
        </span>
        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>▼</span>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          marginTop: '4px',
          maxHeight: '200px',
          overflowY: 'auto',
          zIndex: 10,
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
        }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}>
            <input 
              type="checkbox" 
              checked={isAllSelected}
              onChange={handleSelectAll}
              style={{ marginRight: '0.5rem', marginTop: '0.2rem', width: '16px', height: '16px', flexShrink: 0 }}
            />
            <span style={{ fontSize: '0.9rem', fontWeight: isAllSelected ? 'bold' : 'normal', lineHeight: '1.4' }}>அனைத்தும் (All)</span>
          </label>
          
          {options.map((opt) => {
            const isSelected = selectedValues.includes(opt.value);
            return (
              <label key={opt.value} style={{ display: 'flex', alignItems: 'flex-start', padding: '0.5rem', cursor: 'pointer', backgroundColor: isSelected ? '#f0fdf4' : 'transparent' }}>
                <input 
                  type="checkbox" 
                  checked={isSelected}
                  onChange={() => toggleSelection(opt.value)}
                  style={{ marginRight: '0.5rem', marginTop: '0.2rem', width: '16px', height: '16px', flexShrink: 0 }}
                />
                <span style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{opt.label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
