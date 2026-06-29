import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import axios from 'axios';
import { getToken } from './auth';
import { createGame, updateGame } from './push';

export function packageGame(directory: string, outName?: string) {
  const targetDir = path.resolve(directory);
  
  if (!fs.existsSync(targetDir)) {
    console.error(`Directory not found: ${targetDir}`);
    process.exit(1);
  }

  const logicPath = path.join(targetDir, 'logic.lua');
  const componentPath = path.join(targetDir, 'component.tsx');
  const canvasPath = path.join(targetDir, 'canvas.json');

  if (!fs.existsSync(canvasPath) || !fs.existsSync(logicPath) || !fs.existsSync(componentPath)) {
    console.error('Missing required files. A package must contain at least canvas.json, logic.lua, and component.tsx');
    process.exit(1);
  }

  let canvasData;
  try {
    canvasData = JSON.parse(fs.readFileSync(canvasPath, 'utf-8'));
  } catch (err: any) {
    console.error(`Failed to parse canvas.json: ${err.message}`);
    process.exit(1);
  }

  const packageName = outName || (canvasData.name || 'game').toLowerCase().replace(/[^a-z0-9]/g, '_') + '.pgame';
  const outputPath = path.resolve(packageName);

  const zip = new AdmZip();
  zip.addLocalFile(canvasPath);
  zip.addLocalFile(logicPath);
  zip.addLocalFile(componentPath);

  zip.writeZip(outputPath);
  console.log(`✅ Successfully packaged game into ${outputPath}`);
}

export async function uploadGame(packagePath: string, host: string) {
  const targetPath = path.resolve(packagePath);

  if (!fs.existsSync(targetPath)) {
    console.error(`Package not found: ${targetPath}`);
    process.exit(1);
  }

  const token = getToken();
  if (!token) {
    console.error('Not authenticated. Please run "pandya login" first.');
    process.exit(1);
  }

  console.log(`📦 Extracting ${packagePath}...`);
  const zip = new AdmZip(targetPath);
  
  const canvasEntry = zip.getEntry('canvas.json');
  const logicEntry = zip.getEntry('logic.lua');
  const componentEntry = zip.getEntry('component.tsx');

  if (!canvasEntry || !logicEntry || !componentEntry) {
    console.error('Invalid package: Missing canvas.json, logic.lua, or component.tsx inside the archive.');
    process.exit(1);
  }

  const gdl = JSON.parse(canvasEntry.getData().toString('utf-8'));
  const luaScript = logicEntry.getData().toString('utf-8');
  const uiComponent = componentEntry.getData().toString('utf-8');
  const gameName = gdl.name || 'scaffolded-game';
  const gameDesc = gdl.description || 'Uploaded via Pandya SDK';

  console.log(`🚀 Creating game: ${gameName}...`);
  // Note: we can't directly reuse updateGame/createGame from push.ts easily without rewriting files to disk
  // since push.ts hardcodes reading from process.cwd(). 
  // Let's implement the API calls directly here for cleanliness.

  try {
    const createUrl = `${host}/gameauthor.GameAuthorService/CreateGameDefinition`;
    const createPayload = {
      name: gameName,
      description: gameDesc
    };

    const res = await axios.post(createUrl, createPayload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const gameId = res.data.gameDefinition?.id;
    if (!gameId) {
      throw new Error('Server returned success but no game ID was provided.');
    }

    console.log(`✅ Game created with ID: ${gameId}. Uploading assets...`);

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

    console.log(`🎉 Successfully uploaded package!`);
    console.log(`🎮 Play test it here: ${host.replace('api.', '')}/lobby`);
  } catch (err: any) {
    console.error('❌ Failed to upload game:', err.response?.data || err.message);
    process.exit(1);
  }
}
