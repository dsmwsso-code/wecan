'use client';

import { useState, useRef, useEffect } from 'react';

export default function CameraCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("கமெராவைத் திறக்க முடியவில்லை. கமெரா அனுமதி (Permissions) வழங்கப்பட்டுள்ளதா என சரிபார்க்கவும்.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas size to match video feed
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw image to canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64 (compressing slightly)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      stopCamera();
      onCapture(dataUrl);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', maxWidth: '100%', width: '500px', textAlign: 'center' }}>
        <h3 style={{ marginBottom: '1rem' }}>புகைப்படம் எடுக்கவும்</h3>
        
        {error ? (
          <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>
        ) : (
          <div style={{ position: 'relative', width: '100%', backgroundColor: 'black', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline
              style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          {!error && (
            <button type="button" onClick={capturePhoto} className="btn" style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '0.75rem 1.5rem', fontSize: '1.1rem', borderRadius: '50px' }}>
              📸 Capture
            </button>
          )}
          <button type="button" onClick={() => { stopCamera(); onCancel(); }} className="btn" style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '50px' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
