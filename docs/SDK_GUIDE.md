# Pandya SDK & Tools Guide

The Pandya SDK provides a complete toolchain for developers and AI agents to author, test, and publish custom multiplayer board games and card games to the Pandya.ai platform directly from a local environment.

## 1. SDK Capabilities

The SDK exposes several core capabilities to streamline game development:
- **Game Initialization**: Scaffold new games with standard `logic.lua` (backend rules), `component.tsx` (frontend rendering), and `canvas.json` (layout and metadata) boilerplates.
- **Local Hot-Reloading**: Push your raw code securely to the cloud engine and refresh your browser to instantly test new rules or UI elements without rebuilding the entire project.
- **Validation**: Ensure that your Lua rules (backend) and React components (frontend) align with Pandya's strict state contracts, preventing runtime crashes.
- **Matchmaking & Tournaments**: Create testing lobbies, seed users into a match, and organize multi-match tournaments programmatically through the CLI or API.
- **AI Agent Integration**: Provides MCP endpoints and system prompts to allow AI assistants (like Claude or Antigravity) to author, debug, and simulate code autonomously.

## 2. Usage & Authoring a Game

### Installation & Authentication

To get started, install the SDK globally or link it from the source:

```bash
cd sdk
npm install
npm run build
npm link

# Login to authenticate with the platform using your developer credentials
pandya login
```

### Initializing a Project

Create a new folder and run the init command to scaffold a new game structure:

```bash
mkdir my-awesome-game
cd my-awesome-game
pandya init .
```

This generates three core files that define your game:
- `logic.lua`: The authoritative backend rules engine. This is where you define `setup` (initial state), `get_actions` (what moves are valid), `on_move` (how state changes), and `check_win` (endgame conditions).
- `component.tsx`: The React-Konva frontend. This is where you render the board, pieces, and cards, and capture user interactions to send actions back to the server.
- `canvas.json`: The layout and metadata configuration file, defining board dimensions, assets, and overall visual scaffolding.

### Developing & Testing

Write your game rules in `logic.lua` and design the UI in `component.tsx`. When you are ready to test, push the code to a Draft Game ID (obtained from the pandya.ai Developer Console):

```bash
pandya push <GAME_UUID>
```

Refresh your browser at `https://pandya.ai/play?customId=<GAME_UUID>`. The cloud engine recompiles your React component on the fly, resets the Lua VM state, and applies your new logic immediately. This hot-reloading workflow drastically reduces iteration time.

## 3. Creating Matches & Tournaments

The SDK (via the CLI or programmatic API) allows you to spin up matches and organize tournaments for testing or community events. This is especially useful for playtesting balancing changes.

### Creating a Match

To test your game with real users or bots, you can instantly provision a live match lobby:

```bash
pandya match create --game <GAME_UUID> --players 2 --privacy public
```

This command returns a `MATCH_ID` and a direct join link (e.g., `https://pandya.ai/lobby/<MATCH_ID>`) that you can share with testers, bypassing the standard matchmaking queue.

### Managing Tournaments

For competitive formats (Swiss, Single Elimination), you can instantiate a tournament to group players and automate bracket progression:

```bash
pandya tournament create --game <GAME_UUID> --format elimination --participants 8
```

**Tournament Commands:**
- `pandya tournament list`: View all active brackets and their current status.
- `pandya tournament start <TOURNAMENT_ID>`: Begins the first round, finalizes the bracket, and automatically generates Match IDs for seated players.
- `pandya tournament advance <TOURNAMENT_ID>`: Resolves finished matches, determines winners, and generates the next round of the bracket.

## 4. MCP Tools for AI Agents

For developers using AI assistants, the SDK folder provides configurations to expose these tools via the Model Context Protocol (MCP). This enables agents to act as co-developers:

- `validate_game_code`: Statically verifies that the action payloads dispatched in your React UI (`component.tsx`) perfectly match the action IDs and payload structures defined in your Lua `get_actions()` and `on_move()` functions.
- `simulate_game_logic`: Headlessly runs the Lua VM with a simulated game loop (often using random or greedy agents) to check for syntax errors, infinite loops, and runtime crashes before pushing to the cloud.
- `scaffold_game` / `update_game`: Allows the AI to generate or overwrite the local files based on natural language prompts (e.g., "Build a standard chess game").

To configure your agent to use these tools, start the MCP server included in the `pandya.ai/mcp` directory, or use the SSE endpoint provided by the main engine.
