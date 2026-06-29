import fs from 'fs';
import path from 'path';

export async function initGame(targetDir: string) {
  const dirPath = path.resolve(process.cwd(), targetDir);
  
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const logicContent = `-- pandya.ai Game Logic Script
function setup()
    -- Initialize game state and pieces here
    print("Game setup")
end

function get_actions(player)
    -- Return available actions for the given player
    return {}
end

function on_move(action_id, player, payload)
    -- Handle moves
    print("Move applied")
end

function check_win()
    -- Check if a player has won
    return -1
end
`;

  const componentContent = `import React from 'react';

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
`;

  const canvasContent = `{
  "name": "${path.basename(dirPath)}",
  "description": "A newly scaffolded Pandya game.",
  "players": {
    "min_players": 2,
    "max_players": 2,
    "turn_order": "sequential"
  },
  "board": {
    "width": 800,
    "height": 600,
    "zones": []
  },
  "pieces": [],
  "rules": [],
  "actions": [],
  "phases": []
}
`;

  fs.writeFileSync(path.join(dirPath, 'logic.lua'), logicContent, 'utf-8');
  fs.writeFileSync(path.join(dirPath, 'component.tsx'), componentContent, 'utf-8');
  fs.writeFileSync(path.join(dirPath, 'canvas.json'), canvasContent, 'utf-8');

  console.log(`Successfully initialized game assets in ${dirPath}`);
  console.log('Created: logic.lua, component.tsx, canvas.json');
}
