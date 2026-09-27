# Pandya SDK & Tools Guide

The Pandya SDK provides a complete toolchain for developers and AI agents to author, test, and publish custom multiplayer board games and card games to the Pandya.ai platform directly from a local environment.

## 1. SDK Capabilities

The SDK exposes several core capabilities to streamline game development:
- **Game Initialization**: Scaffold new games with standard `logic.lua` (backend rules) and `canvas.json` (layout and metadata) boilerplates.
- **Local Hot-Reloading**: Push your raw code securely to the cloud engine and refresh your browser to instantly test new rules without rebuilding the entire project.
- **Validation**: Ensure that your Lua rules and your `canvas.json` GDL `actions` list agree with each other, preventing runtime crashes.
- **Packaging & Upload**: Package a game directory into a portable `.pgame` archive and upload it as a new Draft game on the platform, or push assets straight to an existing Draft via `pandya push`.
- **AI Agent Integration**: Provides MCP endpoints and system prompts to allow AI assistants (like Claude or Antigravity) to author, debug, and simulate code autonomously.

## 2. Usage & Authoring a Game

### Installation & Authentication

To get started, install the SDK globally or link it from the source:

```bash
cd sdk
npm install
npm link

# Login to authenticate with the platform using your developer credentials
pandya login
```

Note: `dist/` is shipped prebuilt in the repository — there is **no** `npm run build` step. `npm link` creates the global `pandya` command.

`pandya login` authenticates via OAuth in your browser and saves the token to `./.pandya-token` in the **current working directory**. That path is listed in `.gitignore`, so it will not be committed by accident — but because it is written to whichever directory you log in from, delete it yourself if that directory is ever shared or committed some other way.

### Initializing a Project

Create a new folder and run the init command to scaffold a new game structure:

```bash
mkdir my-awesome-game
cd my-awesome-game
pandya init .
```

This generates the two core files that define your game:
- `logic.lua`: The authoritative backend rules engine. This is where you define `setup` (initial state), `get_actions` (what moves are valid), `on_move` (how state changes), and `check_win` (endgame conditions).
- `canvas.json`: The layout and metadata configuration file, defining board dimensions, zones, pieces, assets, and overall visual scaffolding. The board is rendered from this file, so it — not any React code — is what players actually see.

The platform also expects a third file that this CLI does **not** scaffold: `INSTRUCTIONS.md`, the player-facing "How to Play" manual. Write it as part of authoring (the MCP `create_game` tool does scaffold it), otherwise your game ships with no rules page.

### Developing & Testing

Write your game rules in `logic.lua` and your board layout in `canvas.json`. When you are ready to test, push the code to a Draft Game ID (obtained from the pandya.ai Developer Console):

```bash
pandya push <GAME_UUID>
```

Refresh your browser at `https://pandya.ai/play?customId=<GAME_UUID>`. The cloud engine resets the Lua VM state, re-reads your `canvas.json`, and applies your new logic immediately. This hot-reloading workflow drastically reduces iteration time.

## 3. Packaging & Uploading Games

The SDK can bundle a finished game directory into a shareable archive, or upload it to the platform as a new Draft game.

### Packaging a Game

```bash
pandya package . --out my-game.pgame
```

This creates a `.pgame` archive containing the game's `canvas.json` and `logic.lua`. Set `--out <filename>` to choose where the archive is written.

### Uploading a Game

```bash
pandya upload my-game.pgame
```

This creates a new Draft game on pandya.ai from the archive. To iterate on an **existing** Draft instead, use `pandya push <GAME_UUID>` (which updates the game in place) and refresh `https://pandya.ai/play?customId=<GAME_UUID>` to see the changes.

Note: the CLI currently exposes only `login`, `init`, `push`, `package`, and `upload`. `pandya match`/`pandya tournament` style commands are not part of the SDK.

## 4. MCP Tools for AI Agents

For developers using AI assistants, this repository configures an MCP server (root `mcp.json`) exposing these tools, so agents can act as co-developers:

- `validate_logic_and_canvas`: Statically verifies that the action IDs and payload structures declared in your `canvas.json` GDL `actions` list line up with your Lua `get_actions()` and `on_move()` functions, and that `canvas.json` is well-formed.
- `simulate_game_logic`: Headlessly runs the Lua VM with a simulated game loop (often using random or greedy agents) to check for syntax errors, infinite loops, and runtime crashes before pushing to the cloud.
- `create_game` / `update_game` / `get_game`: Generate, overwrite, or fetch a game's local files based on natural language prompts (e.g., "Build a standard chess game").
- `get_lua_libraries` / `get_ui_components` / `get_authoring_guidelines`: Fetch the engine reference, UI primitives, and authoring prompts.
- `simulate_gameplay` / `get_playtest_logs`: End-to-end browser validation and live playtest session log inspection.

To configure your agent to use these tools, point your MCP client at the remote SSE server `https://pandya.ai/mcp/sse` (the repo's root `mcp.json` already does this), and authenticate with an MCP token via the `PANDYA_API_KEY` environment variable (or an OAuth token from `pandya login`).
