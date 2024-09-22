import React from 'react';

const OutputDisplay = ({ output }) => {
  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: '0.375rem', overflow: 'hidden' }}>
      <div style={{ backgroundColor: '#F3F4F6', padding: '0.75rem 1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Output</h2>
      </div>
      <div style={{ padding: '1rem' }}>
        {output.map((line, index) => (
          <div key={index} style={{ marginBottom: '0.25rem' }}>{line}</div>
        ))}
      </div>
    </div>
  );
};

export default OutputDisplay;