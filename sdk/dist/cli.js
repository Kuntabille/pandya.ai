#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/auth.ts
var auth_exports = {};
__export(auth_exports, {
  getToken: () => getToken,
  login: () => login
});
async function login(host) {
  return new Promise((resolve, reject) => {
    const app = (0, import_express.default)();
    const port = 3001;
    app.get("/callback", (req, res) => {
      const token = req.query.token;
      if (token) {
        import_fs.default.writeFileSync(TOKEN_PATH, token, "utf-8");
        res.send("<h1>Login successful!</h1><p>You can close this window and return to the CLI.</p>");
        console.log("Login successful! Token saved.");
        server.close();
        resolve();
        setTimeout(() => process.exit(0), 100);
      } else {
        res.status(400).send("No token provided");
        reject(new Error("No token provided"));
      }
    });
    const server = app.listen(port, async () => {
      const loginUrl = `${host}/cli-login?redirect=http://localhost:${port}/callback`;
      console.log(`Opening browser to authenticate...`);
      console.log(`If the browser does not open, please navigate to: ${loginUrl}`);
      try {
        await (0, import_open.default)(loginUrl);
      } catch (err) {
        console.error("Failed to open browser:", err);
      }
    });
  });
}
function getToken() {
  if (import_fs.default.existsSync(TOKEN_PATH)) {
    return import_fs.default.readFileSync(TOKEN_PATH, "utf-8").trim();
  }
  return null;
}
var import_express, import_open, import_fs, import_path, TOKEN_PATH;
var init_auth = __esm({
  "src/auth.ts"() {
    "use strict";
    import_express = __toESM(require("express"));
    import_open = __toESM(require("open"));
    import_fs = __toESM(require("fs"));
    import_path = __toESM(require("path"));
    TOKEN_PATH = import_path.default.join(process.cwd(), ".pandya-token");
  }
});

// src/init.ts
var init_exports = {};
__export(init_exports, {
  initGame: () => initGame
});
async function initGame(targetDir) {
  const dirPath = import_path2.default.resolve(process.cwd(), targetDir);
  if (!import_fs2.default.existsSync(dirPath)) {
    import_fs2.default.mkdirSync(dirPath, { recursive: true });
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
  "name": "${import_path2.default.basename(dirPath)}",
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
  "phases": [],
  "variations": [
    {
      "id": "default",
      "name": "Default",
      "description": "The base game rules without any variations applied."
    }
  ]
}
`;
  import_fs2.default.writeFileSync(import_path2.default.join(dirPath, "logic.lua"), logicContent, "utf-8");
  import_fs2.default.writeFileSync(import_path2.default.join(dirPath, "component.tsx"), componentContent, "utf-8");
  import_fs2.default.writeFileSync(import_path2.default.join(dirPath, "canvas.json"), canvasContent, "utf-8");
  console.log(`Successfully initialized game assets in ${dirPath}`);
  console.log("Created: logic.lua, component.tsx, canvas.json");
}
var import_fs2, import_path2;
var init_init = __esm({
  "src/init.ts"() {
    "use strict";
    import_fs2 = __toESM(require("fs"));
    import_path2 = __toESM(require("path"));
  }
});

// src/push.ts
var push_exports = {};
__export(push_exports, {
  createGame: () => createGame,
  pushGame: () => pushGame,
  updateGame: () => updateGame
});
async function createGame(name, host) {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated. Please run "pandya login" first.');
  }
  const url = `${host}/gameauthor.GameAuthorService/CreateGameDefinition`;
  const payload = {
    name,
    description: "Generated via Antigravity CLI"
  };
  const res = await import_axios.default.post(url, payload, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  const gameId = res.data.gameDefinition?.id;
  if (!gameId) {
    throw new Error("Server returned success but no game ID was provided.");
  }
  return gameId;
}
async function updateGame(gameId, host, publish = false) {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated. Please run "pandya login" first.');
  }
  const cwd = process.cwd();
  const logicPath = import_path3.default.join(cwd, "logic.lua");
  const componentPath = import_path3.default.join(cwd, "component.tsx");
  const canvasPath = import_path3.default.join(cwd, "canvas.json");
  if (!import_fs3.default.existsSync(logicPath) || !import_fs3.default.existsSync(componentPath)) {
    throw new Error("Missing required files. Ensure logic.lua and component.tsx exist in the current directory.");
  }
  const luaScript = import_fs3.default.readFileSync(logicPath, "utf-8");
  const uiComponent = import_fs3.default.readFileSync(componentPath, "utf-8");
  let gdl = void 0;
  if (import_fs3.default.existsSync(canvasPath)) {
    try {
      gdl = JSON.parse(import_fs3.default.readFileSync(canvasPath, "utf-8"));
    } catch (e) {
      throw new Error(`Failed to parse canvas.json: ${e.message}`);
    }
  }
  const updateUrl = `${host}/gameauthor.GameAuthorService/UpdateGameDefinition`;
  const updatePayload = {
    id: gameId,
    lua_script: luaScript,
    ui_component_code: uiComponent,
    create_version: true
  };
  if (gdl) {
    updatePayload.gdl = gdl;
  }
  await import_axios.default.post(updateUrl, updatePayload, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  if (publish) {
    const publishUrl = `${host}/gameauthor.GameAuthorService/PublishGameDefinition`;
    await import_axios.default.post(publishUrl, { id: gameId, is_public: true }, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
  }
}
async function pushGame(gameId, host) {
  try {
    await updateGame(gameId, host, false);
    console.log("Successfully pushed game assets! Refresh the browser to play/test.");
  } catch (err) {
    console.error("Failed to push game:", err.response?.data || err.message);
    process.exit(1);
  }
}
var import_fs3, import_path3, import_axios;
var init_push = __esm({
  "src/push.ts"() {
    "use strict";
    import_fs3 = __toESM(require("fs"));
    import_path3 = __toESM(require("path"));
    import_axios = __toESM(require("axios"));
    init_auth();
  }
});

// src/package.ts
var package_exports = {};
__export(package_exports, {
  packageGame: () => packageGame,
  uploadGame: () => uploadGame
});
function packageGame(directory, outName) {
  const targetDir = import_path4.default.resolve(directory);
  if (!import_fs4.default.existsSync(targetDir)) {
    console.error(`Directory not found: ${targetDir}`);
    process.exit(1);
  }
  const logicPath = import_path4.default.join(targetDir, "logic.lua");
  const componentPath = import_path4.default.join(targetDir, "component.tsx");
  const canvasPath = import_path4.default.join(targetDir, "canvas.json");
  if (!import_fs4.default.existsSync(canvasPath) || !import_fs4.default.existsSync(logicPath) || !import_fs4.default.existsSync(componentPath)) {
    console.error("Missing required files. A package must contain at least canvas.json, logic.lua, and component.tsx");
    process.exit(1);
  }
  let canvasData;
  try {
    canvasData = JSON.parse(import_fs4.default.readFileSync(canvasPath, "utf-8"));
  } catch (err) {
    console.error(`Failed to parse canvas.json: ${err.message}`);
    process.exit(1);
  }
  const packageName = outName || (canvasData.name || "game").toLowerCase().replace(/[^a-z0-9]/g, "_") + ".pgame";
  const outputPath = import_path4.default.resolve(packageName);
  const zip = new import_adm_zip.default();
  zip.addLocalFile(canvasPath);
  zip.addLocalFile(logicPath);
  zip.addLocalFile(componentPath);
  zip.writeZip(outputPath);
  console.log(`\u2705 Successfully packaged game into ${outputPath}`);
}
async function uploadGame(packagePath, host) {
  const targetPath = import_path4.default.resolve(packagePath);
  if (!import_fs4.default.existsSync(targetPath)) {
    console.error(`Package not found: ${targetPath}`);
    process.exit(1);
  }
  const token = getToken();
  if (!token) {
    console.error('Not authenticated. Please run "pandya login" first.');
    process.exit(1);
  }
  console.log(`\u{1F4E6} Extracting ${packagePath}...`);
  const zip = new import_adm_zip.default(targetPath);
  const canvasEntry = zip.getEntry("canvas.json");
  const logicEntry = zip.getEntry("logic.lua");
  const componentEntry = zip.getEntry("component.tsx");
  if (!canvasEntry || !logicEntry || !componentEntry) {
    console.error("Invalid package: Missing canvas.json, logic.lua, or component.tsx inside the archive.");
    process.exit(1);
  }
  const gdl = JSON.parse(canvasEntry.getData().toString("utf-8"));
  const luaScript = logicEntry.getData().toString("utf-8");
  const uiComponent = componentEntry.getData().toString("utf-8");
  const gameName = gdl.name || "scaffolded-game";
  const gameDesc = gdl.description || "Uploaded via Pandya SDK";
  console.log(`\u{1F680} Creating game: ${gameName}...`);
  try {
    const createUrl = `${host}/gameauthor.GameAuthorService/CreateGameDefinition`;
    const createPayload = {
      name: gameName,
      description: gameDesc
    };
    const res = await import_axios2.default.post(createUrl, createPayload, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    const gameId = res.data.gameDefinition?.id;
    if (!gameId) {
      throw new Error("Server returned success but no game ID was provided.");
    }
    console.log(`\u2705 Game created with ID: ${gameId}. Uploading assets...`);
    const updateUrl = `${host}/gameauthor.GameAuthorService/UpdateGameDefinition`;
    const updatePayload = {
      id: gameId,
      lua_script: luaScript,
      ui_component_code: uiComponent,
      create_version: true
    };
    if (gdl) {
      updatePayload.gdl = gdl;
    }
    await import_axios2.default.post(updateUrl, updatePayload, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    console.log(`\u{1F389} Successfully uploaded package!`);
    console.log(`\u{1F3AE} Play test it here: ${host.replace("api.", "")}/lobby`);
  } catch (err) {
    console.error("\u274C Failed to upload game:", err.response?.data || err.message);
    process.exit(1);
  }
}
var import_fs4, import_path4, import_adm_zip, import_axios2;
var init_package = __esm({
  "src/package.ts"() {
    "use strict";
    import_fs4 = __toESM(require("fs"));
    import_path4 = __toESM(require("path"));
    import_adm_zip = __toESM(require("adm-zip"));
    import_axios2 = __toESM(require("axios"));
    init_auth();
  }
});

// src/cli.ts
var import_commander = require("commander");
var program = new import_commander.Command();
program.name("pandya").description("CLI and SDK for pandya.ai game authoring").version("1.0.0");
program.command("login").description("Login to pandya.ai (or a local instance) via OAuth").option("-h, --host <url>", "The pandya instance URL", "https://pandya.ai").action(async (options) => {
  const { login: login2 } = await Promise.resolve().then(() => (init_auth(), auth_exports));
  await login2(options.host);
});
program.command("init").description("Scaffold a new game in the current directory").argument("[directory]", "Directory to initialize (defaults to current)", ".").action(async (directory) => {
  const { initGame: initGame2 } = await Promise.resolve().then(() => (init_init(), init_exports));
  await initGame2(directory);
});
program.command("push").description("Push game assets to pandya.ai for testing (Updates Draft)").argument("<gameId>", "The ID of the game to push assets to").option("-h, --host <url>", "The pandya instance URL", "https://pandya.ai").action(async (gameId, options) => {
  const { pushGame: pushGame2 } = await Promise.resolve().then(() => (init_push(), push_exports));
  await pushGame2(gameId, options.host);
});
program.command("package").description("Package a game directory into a .pgame archive").argument("[directory]", "Directory containing the game files", ".").option("-o, --out <filename>", "Output filename (e.g. game.pgame)").action(async (directory, options) => {
  const { packageGame: packageGame2 } = await Promise.resolve().then(() => (init_package(), package_exports));
  packageGame2(directory, options.out);
});
program.command("upload").description("Upload a .pgame archive to pandya.ai (Creates a Draft game)").argument("<package>", "Path to the .pgame file").option("-h, --host <url>", "The pandya instance URL", "https://pandya.ai").action(async (pkg, options) => {
  const { uploadGame: uploadGame2 } = await Promise.resolve().then(() => (init_package(), package_exports));
  await uploadGame2(pkg, options.host);
});
program.parse();
