import fs from 'fs';
import { promises as fsPromises } from 'fs';
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

  // ⚡ BOLT OPTIMIZATION:
  // Replaced synchronous `fs.existsSync` and `fs.readFileSync` with `fsPromises.readFile` and `Promise.all`
  // to prevent blocking the event loop and to load files concurrently.
  // We use try-catch on `readFile` to check existence without an extra syscall (avoiding a race condition).

  let luaScript: string, uiComponent: string;
  try {
    [luaScript, uiComponent] = await Promise.all([
      fsPromises.readFile(logicPath, 'utf-8'),
      fsPromises.readFile(componentPath, 'utf-8')
    ]);
  } catch (err: any) {
    throw new Error('Missing required files. Ensure logic.lua and component.tsx exist in the current directory.');
  }

  let gdl = undefined;
  try {
    const canvasData = await fsPromises.readFile(canvasPath, 'utf-8');
    gdl = JSON.parse(canvasData);
  } catch (e: any) {
    if (e.code !== 'ENOENT') {
      throw new Error(`Failed to parse canvas.json: ${e.message}`);
    }
    // canvas.json is optional, ignore ENOENT
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
