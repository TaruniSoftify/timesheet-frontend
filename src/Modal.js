import React from 'react';

const Modal = ({ message, onClose }) => {
  if (!message) return null; // Don't render if no message

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <p style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#333' }}>{message}</p>
        <button onClick={onClose} style={buttonStyle}>OK</button>
      </div>
    </div>
  );
};

// Styles ensure it perfectly overlays without breaking existing alignments
const overlayStyle = {
  position: 'fixed', 
  top: 0, 
  left: 0, 
  right: 0, 
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center',
  zIndex: 9999 // Ensures it stays on top of everything
};

const modalStyle = {
  background: '#fff', 
  padding: '24px 32px', 
  borderRadius: '8px',
  minWidth: '300px', 
  textAlign: 'center', 
  boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
};

const buttonStyle = {
  padding: '8px 24px', 
  background: '#374151', 
  color: '#fff',
  border: 'none', 
  borderRadius: '4px', 
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500'
};

export default Modal;
