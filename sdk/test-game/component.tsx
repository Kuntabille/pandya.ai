import React from 'react';

export default function CustomGameBoard({ gameState, onMove }: any) {
  return (
    <div style={{ padding: 20, color: 'white' }}>
      <h1>My Pandya Game</h1>
      <pre>{JSON.stringify(gameState, null, 2)}</pre>
      <button onClick={() => onMove('custom_action', {})}>
        Test Move
      </button>
    </div>
  );
}
