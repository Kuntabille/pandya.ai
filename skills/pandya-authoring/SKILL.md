---
name: pandya-authoring
description: Context and tools for building games on pandya.ai
---
# Pandya Game Authoring Instructions

You are an AI assistant helping a developer build a game on the pandya.ai platform.
Pandya runs game rules on a Go-based Lua engine and renders the board declaratively
from the GDL in `canvas.json` via a precompiled renderer. A game is data plus rules;
there is no per-game React component.

## MCP tools

The authoring tools are served by the hosted pandya.ai MCP server at
`https://pandya.ai/mcp/sse`. Register it with your client once:

```json
{
  "mcpServers": {
    "pandya": { "url": "https://pandya.ai/mcp/sse" }
  }
}
```

Authenticate with a `PANDYA_API_KEY` token (pandya.ai → Profile → Developer
Settings). There is no CLI and no local stdio bridge — the hosted server is the
entire authoring surface.

You have access to these MCP tools:
- `create_game`: Scaffolds a new pandya.ai draft game (canvas.json, logic.lua, INSTRUCTIONS.md) from a name and description.
- `get_authoring_guidelines`: Retrieves the comprehensive authoring prompts (Canvas/Lua/UI rules).
- `get_lua_libraries`: Returns the Lua library signatures — the engine hooks and the `game.*`/`board.*`/`piece.*`/`util.*` APIs available to `logic.lua`.
- `get_ui_components`: Returns the available React UI primitives and GDL Theme Catalog presets.
- `validate_logic_and_canvas`: Statically validates the Lua script and canvas.json against engine contracts (the GDL `actions` ⇄ Lua `get_actions` contract), plus a headless simulation.
- `simulate_game_logic`: Runs the Lua VM headlessly to check for runtime errors.
- `simulate_gameplay`: Runs an end-to-end browser simulation of UI + logic.
- `update_game`: Updates an existing game's content (canvas.json, logic.lua, INSTRUCTIONS.md) by `game_id`.
- `get_game`: Fetches an existing game's content by `game_id`.
- `get_playtest_logs`: Fetches execution logs for a live playtest session.

## The three files that make up a game
1. `canvas.json` - the GDL layout: board, zones, pieces, themes, and the `actions` contract.
2. `logic.lua` - the rules: a state machine implementing the hooks below.
3. `INSTRUCTIONS.md` - the player-facing "How to Play" manual.

Piece/zone types and `ui.theme` are protobuf enums, written in `canvas.json` using the full enum value name (e.g. `"PIECE_TYPE_CARD"`, `"ZONE_TYPE_TABLEAU"`). Live matches and the Play-Test board render declaratively from `canvas.json` through the platform's precompiled renderer, so anything game-specific (rules, interactions, card→action mapping) must live in these three files. Do not generate `component.tsx`.

## Lua engine (as of the internal engine)
Game hooks: `setup(players)`, `get_actions()` (returns a list of `{id, name, type}` action tables), `on_move(player_index, action_id, move_table)` (returns `accepted: bool, reason: string`), and `check_win()` (returns `{winner=<player index>}` / `{draw=true}` / `nil`).
State module globals: `board.*`, `game.*`, `piece.*`, `util.*`, `paths.*`, and `campaign.*` (e.g. `game.set_var`/`game.get_var`, `game.place_piece(def_id, "col,row", owner_index)`, `game.move_piece(piece_id, "col,row")`, `game.end_turn()`, `board.is_empty(pos)`, `piece.set_attr(piece_id, key, val)`, `util.random(min, max)`, `paths.advance(path_id, cell, steps)`). The move table passed to `on_move` has keys `action_id`, `piece_id`, `target_cell`, `target_piece_id`, `from`, plus flat custom properties.

## Workflow
1. Call `create_game` to scaffold the game.
2. Call `get_authoring_guidelines` (and `get_lua_libraries` / `get_ui_components` as needed) to fetch the rules for whichever component you are generating.
3. Act as the **Canvas Agent**: Define the game board layout by generating or updating the `canvas.json` (Canvas GDL) based on the game description. Ensure you merge your changes with the existing `canvas.json` if one exists. This is crucial for configuring min_players, max_players, and defining the spatial layout (zones, pieces).
4. Act as the **Logic Agent**: Read the `canvas.json` layout, then write the `logic.lua` state machine.
5. Act as the **Instructions Agent**: Write `INSTRUCTIONS.md`, the player-facing manual. It must read like a printed board-game rulebook: plain language, no implementation detail. Never mention file names, action IDs, `get_actions`, zones, layout types, board cell coordinates, or any other engine internal - describe only what a player sees and does. Cover the goal, the board, the pieces, setup, turn flow, how to win, one worked example round, and a short quick reference. Put `{{BOARD_DIAGRAM}}` on its own line so the platform renders a real board picture in its place.
6. Save the three files with `update_game(game_id, canvas_json, logic_script, instructions_markdown)`.
7. Validate the code using the MCP tools (`validate_logic_and_canvas`, then `simulate_game_logic`, and optionally `simulate_gameplay`). Fix what they report and repeat until the validation passes.

## Hard contracts
- **The GDL `actions` list is the single source of truth.** Every id it declares must be returned by Lua `get_actions()`, and every id Lua returns must be declared in the GDL — the validator fails on a mismatch in either direction. Reuse the generic ids (`draw`, `shuffle`, `roll`, `flip`, `peek`, `play_card`, `play_pair`, `discard`, `move`, `capture`, `give`, `endTurn`) and branch on payload data (`move.card_type`, `move.piece_id`) instead of minting per-card ids such as `play_favor`.
- **Payloads are flat `snake_case`.** Never nest parameters under a `payload` object. GDL action ids are camelCase (`endTurn`); the Lua functions that act on them are snake_case (`game.end_turn()`).
- **Anything the game computes without a player deciding** (an end-of-era conflict, a tally, a final standings score) must go through `game.begin_system_phase(...)` + `on_system_phase(ctx)` so the arithmetic is published to every player, and `check_win` must read the result from `game.bookkeeping_total(i)`.
- **Lua is not Python.** `else:` / `then:` / `if:` with a trailing colon are syntax errors.
- Never write files to disk expecting the platform to pick them up: the game record is the source of truth, so use `update_game`.
- Never commit your `PANDYA_API_KEY` token.
