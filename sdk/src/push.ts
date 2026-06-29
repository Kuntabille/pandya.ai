import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { getToken } from './auth';

export async function createGame(name: string, host: string): Promise<string> {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated. Please run "pandya login" first.');
  }

  const url = `${host}/gameauthor.GameAuthorService/CreateGameDefinition`;
  const payload = {
    name: name,
    description: 'Generated via Antigravity CLI',
  };

  const res = await axios.post(url, payload, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const gameId = res.data.gameDefinition?.id;
  if (!gameId) {
    throw new Error('Server returned success but no game ID was provided.');
  }

  return gameId;
}

export async function updateGame(gameId: string, host: string, publish: boolean = false) {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated. Please run "pandya login" first.');
  }

  const cwd = process.cwd();
  const logicPath = path.join(cwd, 'logic.lua');
  const componentPath = path.join(cwd, 'component.tsx');
  const canvasPath = path.join(cwd, 'canvas.json');

  if (!fs.existsSync(logicPath) || !fs.existsSync(componentPath)) {
    throw new Error('Missing required files. Ensure logic.lua and component.tsx exist in the current directory.');
  }

  const luaScript = fs.readFileSync(logicPath, 'utf-8');
  const uiComponent = fs.readFileSync(componentPath, 'utf-8');

  let gdl = undefined;
  if (fs.existsSync(canvasPath)) {
    try {
      gdl = JSON.parse(fs.readFileSync(canvasPath, 'utf-8'));
    } catch (e: any) {
      throw new Error(`Failed to parse canvas.json: ${e.message}`);
    }
  }

  // Update logic and UI code
  const updateUrl = `${host}/gameauthor.GameAuthorService/UpdateGameDefinition`;
  const updatePayload: any = {
    id: gameId,
    lua_script: luaScript,
    ui_component_code: uiComponent,
    create_version: true
  };

  if (gdl) {
    updatePayload.gdl = gdl;
  }

  await axios.post(updateUrl, updatePayload, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  // Publish if requested
  if (publish) {
    const publishUrl = `${host}/gameauthor.GameAuthorService/PublishGameDefinition`;
    await axios.post(publishUrl, { id: gameId, is_public: true }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }
}

// Kept for backwards compatibility if the CLI itself was calling it, or we rename it in cli.ts too
export async function pushGame(gameId: string, host: string) {
  try {
    await updateGame(gameId, host, false);
    console.log('Successfully pushed game assets! Refresh the browser to play/test.');
  } catch (err: any) {
    console.error('Failed to push game:', err.response?.data || err.message);
    process.exit(1);
  }
}
