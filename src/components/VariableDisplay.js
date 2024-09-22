import React from 'react';

const VariableDisplay = ({ variables }) => {
  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: '0.375rem', overflow: 'hidden' }}>
      <div style={{ backgroundColor: '#F3F4F6', padding: '0.75rem 1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Variables</h2>
      </div>
      <div style={{ padding: '1rem' }}>
        {Object.entries(variables).map(([name, value]) => (
          <div key={name} style={{ marginBottom: '0.25rem' }}>
            <strong>{name}:</strong> {JSON.stringify(value)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VariableDisplay;