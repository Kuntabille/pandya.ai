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

Clients that support OAuth connect with just that URL: the server answers the
first unauthenticated request with a `401` carrying a `resource_metadata`
challenge, the client discovers the authorization server, and you approve access
on a consent screen (scopes and the redirect target are shown in full). Access
can be revoked at any time from pandya.ai → Profile → Developer Settings.

Clients that cannot run a browser flow (headless agents, scripts, CI) authenticate
with a `PANDYA_API_KEY` personal access token instead, passed as a bearer header:

```json
{
  "mcpServers": {
    "pandya": {
      "url": "https://pandya.ai/mcp/sse",
      "headers": { "Authorization": "Bearer pandya_mcp_..." }
    }
  }
}
```

Personal access tokens are no longer generated from the profile UI: the Developer
section now lists your connected applications and disconnects them, because OAuth
is the supported way to connect. An existing `pandya_mcp_*` token keeps working.
If a headless client needs to connect and you have no token, connect an
OAuth-capable client instead.

There is no CLI and no local stdio bridge — the hosted server is the entire
authoring surface. A2A callers (`/a2a/...`) still authenticate with
`pandya_mcp_*` tokens only.

You have access to these MCP tools:
- `create_game`: Scaffolds a new pandya.ai draft game (canvas.json, logic.lua, INSTRUCTIONS.md) from a name and description.
- `get_authoring_guidelines`: Retrieves the comprehensive authoring prompts (Canvas/Lua/UI rules).
- `get_lua_libraries`: Returns the Lua library signatures — the engine hooks and the `game.*`/`board.*`/`piece.*`/`util.*` APIs available to `logic.lua`.
- `get_ui_components`: Returns the available React UI primitives and GDL Theme Catalog presets.
- `validate_logic_and_canvas`: Statically validates the Lua script and canvas.json against engine contracts (the GDL `actions` ⇄ Lua `get_actions` contract), plus a headless simulation and, when you pass `scenarios_json`, your executable rule scenarios.
- `simulate_game_logic`: Runs the Lua VM headlessly to check for runtime errors.
- `simulate_gameplay`: Runs an end-to-end browser simulation of UI + logic.
- `update_game`: Updates an existing game's content (canvas.json, logic.lua, scenarios.json, INSTRUCTIONS.md) by `game_id`. It validates the merged state, scenarios included, so a failing scenario rejects the write.
- `get_game`: Fetches an existing game's content by `game_id`.
- `get_playtest_logs`: Fetches execution logs for a live playtest session.

## The four files that make up a game
1. `canvas.json` - the GDL layout: board, zones, pieces, themes, and the `actions` contract.
2. `logic.lua` - the rules: a state machine implementing the hooks below.
3. `scenarios.json` - executable rule scenarios: multi-step flows the validator runs in the real engine. Not player-facing; not part of `logic.lua`.
4. `INSTRUCTIONS.md` - the player-facing "How to Play" manual.

Piece/zone types and `ui.theme` are protobuf enums, written in `canvas.json` using the full enum value name (e.g. `"PIECE_TYPE_CARD"`, `"ZONE_TYPE_TABLEAU"`). Live matches and the Play-Test board render declaratively from `canvas.json` through the platform's precompiled renderer, so anything game-specific (rules, interactions, card→action mapping) must live in these four files. Do not generate `component.tsx`.

## Lua engine (as of the internal engine)
Game hooks: `setup(players)`, `get_actions()` (returns a list of `{id, name, type}` action tables), `on_move(player_index, action_id, move_table)` (returns `accepted: bool, reason: string`), and `check_win()` (returns `{winner=<player index>}` / `{draw=true}` / `nil`).
State module globals: `board.*`, `game.*`, `piece.*`, `util.*`, `paths.*`, and `campaign.*` (e.g. `game.set_var`/`game.get_var`, `game.place_piece(def_id, "col,row", owner_index)`, `game.move_piece(piece_id, "col,row")`, `game.end_turn()`, `board.is_empty(pos)`, `piece.set_attr(piece_id, key, val)`, `util.random(min, max)`, `paths.advance(path_id, cell, steps)`). The move table passed to `on_move` has keys `action_id`, `piece_id`, `target_cell`, `target_piece_id`, `from`, plus flat custom properties. State persists as JSON: a per-seat map may be keyed `m[seat]` or `m[tostring(seat)]` and both resolve to the same entry on read, write and delete, but `#m`/`ipairs(m)` only work on a dense 1-based list (a hand, a deck) — a map (or any table with a 0 key or holes) comes back as an object, so iterate it with `pairs()`.

## Workflow
1. Call `create_game` to scaffold the game.
2. Call `get_authoring_guidelines` (and `get_lua_libraries` / `get_ui_components` as needed) to fetch the rules for whichever component you are generating.
3. Act as the **Canvas Agent**: Define the game board layout by generating or updating the `canvas.json` (Canvas GDL) based on the game description. Ensure you merge your changes with the existing `canvas.json` if one exists. This is crucial for configuring min_players, max_players, and defining the spatial layout (zones, pieces).
4. Act as the **Logic Agent**: Read the `canvas.json` layout, then write the `logic.lua` state machine.
5. Act as the **Instructions Agent**: Write `INSTRUCTIONS.md`, the player-facing manual. It must read like a printed board-game rulebook: plain language, no implementation detail. Never mention file names, action IDs, `get_actions`, zones, layout types, board cell coordinates, or any other engine internal - describe only what a player sees and does. Cover the goal, the board, the pieces, setup, turn flow, how to win, one worked example round, and a short quick reference. Put `{{BOARD_DIAGRAM}}` on its own line so the platform renders a real board picture in its place.
6. Save the files with `update_game(game_id, canvas_json, logic_script, scenarios_json, instructions_markdown)`. A scenario-only change is an isolated write: `update_game` takes `scenarios_json` on its own, so adding one check never means rewriting `logic.lua`.
7. Validate the code using the MCP tools (`validate_logic_and_canvas`, then `simulate_game_logic`, and optionally `simulate_gameplay`). Fix what they report and repeat until the validation passes.

## Hard contracts
- **Compose for a landscape screen.** The game is played on a 16:9 laptop or TV screen (a Zoom meeting window), never as a page. Author the zone ENVELOPE — the union of every zone's `x + width` and `y + height`, which is what the renderer builds the stage from — to about **1600x900** and a ratio of **1.6-1.8:1**, never below 1.5:1, and never portrait. Use three bands and never a fourth stacked row: shared board left/centre (~60-70% of the width), a detail rail on the right (~25%, decks/discard/offer/display/player aids stacked in a column), and the viewing seat's `ZONE_TYPE_TABLEAU` mat along the bottom (full width, ~200 tall, children in one left-to-right row). Opponent tablets are drawn by the renderer above the stage, so do not reserve space for them. The first layout pass must already be the landscape one: place each entity in the zone that owns it rather than at a default point, and never walk zones right *and* down with a fixed step. The stage scales by available width only, so a tall envelope overflows instead of shrinking; keep glyphs and labels large enough to read at roughly 0.63x.
- **The GDL `actions` list is the single source of truth.** Every id it declares must be returned by Lua `get_actions()`, and every id Lua returns must be declared in the GDL — the validator fails on a mismatch in either direction. Declare the minimum set of *generic* ids the rules imply (`endTurn`, `roll`, `flip`, `move`, `capture`, `give`, plus `draw`/`shuffle`/`peek`/`discard` when the game has decks and `play_card`/`play_pair` when it plays cards) and branch on the payload (`move.card_type`, `move.piece_id`, `move.to`) instead of minting a rule-specific or per-item id (a named favour, skip, stage, build or character).
- **`board.type` is the coordinate model.** `BOARD_TYPE_GRID` targets square `"x,y"` cells; `BOARD_TYPE_HEX` targets axial `"q,r"` cells (a hexagonal island when `hex_radius > 0`, otherwise a `width` x `height` odd-r rectangle). On a hex board `grid.neighbors`, `util.distance` and `util.is_adjacent` use the six-neighbour metric automatically, `board.cells()` lists the map, and a piece outside it fails validation as a `Hex Placement Error`. Hex boards also expose **corners** (`"q,r,cN"`) and **edges** (`"q,r,eN"`) as addressable targets (a radius-2 island has 54 corners and 72 edges), so intersection and edge pieces can be placed natively via `board.corners()`/`board.edges()`. `board.configure{...}` inside `setup(players)` rebuilds the geometry per match (radius, width/height, or an explicit cell list). Hex zone layouts (`hex_pointy`/`hex_flat`) only arrange pieces visually — they do not create targetable cells.
- **Art is uploaded, not linked.** Use `upload_asset` (PNG/JPEG/GIF, up to 8MB and 4096px per side) and set the returned `assetId` as `visual.front_asset_id` (or `back_asset_id`). One template can serve many images: set `properties.front_asset_id` per instance (a different image per piece) instead of cloning the template. `list_assets` shows what already exists. The Agni/Bhudi orchestrators have the same capability in-loop (`upload_image_asset`, and `generate_image_asset` when the deployment configures an image model). Every upload is validated and moderated before it is stored; a flagged or unparseable image is rejected.
- **Prove the rules with `scenarios.json`, not prose.** An effect that hands control to another seat (a favour, a steal, a counter, a response window) cannot be verified statically, so declare it: `{"scenarios":[{"name":"…","playerCount":2,"seed":7,"steps":[{"player":0,"actionId":"…","properties":{…}}],"expect":[{"currentPlayerIndex":1,"phase":"RESPONSE","availableActionIds":["…"]}]}]}`. Keys are camelCase and an unknown key is rejected; every `expect` entry needs at least one assertion (`currentPlayerIndex`, `phase`, `availableActionIds`, `availableActionIdsAbsent`, `handCounts`, `handCountDelta`, `gameOver`, `winnerSeat`, `turnNumber`, `variableSets`); `"player": -1` means "whoever is on the clock"; a scenario must involve two seats; a fixed `seed` makes a failure reproducible. `availableActionIds` is the EXACT set from `get_actions()`, which is the assertion that catches a victim who is still offered everything. A failure is reported as `Rule Scenario Failed (<name>)` with expected/actual. The old `rule_scenarios()` hook inside `logic.lua` is retired — the validator only runs `scenarios.json` and warns if it finds the hook.
- **Payloads are flat `snake_case`.** Never nest parameters under a `payload` object. GDL action ids are camelCase (`endTurn`); the Lua functions that act on them are snake_case (`game.end_turn()`).
- **Anything the game computes without a player deciding** (an end-of-era conflict, a tally, a final standings score) must go through `game.begin_system_phase(...)` + `on_system_phase(ctx)` so the arithmetic is published to every player, and `check_win` must read the result from `game.bookkeeping_total(i)`.
- **An action an opponent may counter resolves on a clock, not on a queue.** Open `game.set_response_window(seconds, tag)` from `on_move` when a player lodges an interruptible action; opponents may then play an action marked `interrupt = true`, and when the window expires the engine calls `on_response_timeout(tag)` — that hook is where the pending action resolves (pass/allow/succeed). An accepted move closes the window it answered and a rejected one leaves it armed, so a counter chain is just each counter opening the next window (LIFO); keep the pending stack in game state, not in the engine. The validator rejects a window with no `on_response_timeout`.
- **Model physical classes and piles, not values.** One template per physical component class (a `train_card`) with per-instance `properties.color`/`icon`/`label`; one zone per physical pile/hand/row (a deck, a face-up row, a hand, a ticket stack), never one zone per card. **`setup.entities` is the physical box, not the opening table**: every template needs at least one authored instance (validation fails with `Canvas Box Error`) — the full 52-card deck, a seat's whole supply, claim markers and trophies that appear later, every tile a larger player count would use — while `setup()` puts only the components actually in play, so extra authoring instances are never rendered. **A box that scales with the seat count** (an Era deck of `7 x N` cards) authors one row per distinct face with `"count": "7 * N"` (`N` = player count; arithmetic only) instead of one row per unit; a NUMERIC `properties.count` is the gameplay `xN` badge, not a multiplier. A lookup table the rules never act on (building costs, a scoring summary, a turn-order cheat sheet) is ONE `ZONE_TYPE_PLAYER_AID` zone whose rows live in `layoutConfig.sections` — it holds no pieces, takes no clicks, and Lua must not reference it. **The seat's mat holds everything that seat needs**: a `tableau` with `hand`, `supply` (remaining physical pieces, mirrored from Lua after `setup` and every spend), `played`/`built`, and the `cost_card` player aid — a limit the rules enforce must be visible there, never just a Lua counter. Every one of those zones must be a tableau child; a seat-suffixed list written to a non-per-player zone is dropped (`Player Mat Error`). A public fan shows every card, a private stack spreads its cards so each is clickable, and a hand fan fits the effective width. Group player zones under one `ZONE_TYPE_TABLEAU` container with `parentId` children (no `repeat_per_player`). The validator warns when two templates differ only by visual colour/icon/label. `ui.board_image_asset_id` is the printed playing surface (asset_type `board`; `cover`-cropped, so align `board.paths` to its aspect ratio) and `ui.background_image_asset_id` is only the table behind the zones (asset_type `background`; an opaque board surface covers it, so a map there is not on the board); `board.paths` accepts `label`/`color`/`width`/`click_action` (a click dispatches that action with `targetCell`/`pathId` = the path id, so mapped routes need no separate chips). The validator warns on 3+ one-card card zones and on a card zone too narrow for its cards.
- **A piece can carry its own look.** `properties.color/icon/shape/text_color/front_asset_id` override the template (`text_color` inks a token digit or a tile/hex label; a token's `label` is a second line under its icon — caption, pip row or count), `properties.count` badges a quantity, `properties.overlay: true` layers a marker over a base glyph instead of stacking them side by side, and `visual.width/height` (percent of the cell) plus `visual.rotation` size and turn a `bar`/tile. Use these instead of cloning a template per variant. A card's label is sized from the card's width and ellipsized on one line; `properties.wrap: true` wraps it instead, and `properties.font_scale` (0.5-4) scales it. Tokens without an authored `text_color` get cream ink on a dark fill; a token `label` is a second line under the icon. A `selectCell` action declares its board targets with `selection.target_kinds` (`TARGET_KIND_CORNER` / `TARGET_KIND_EDGE`; the display-name heuristic is only the fallback when nothing is declared, so never rely on it); a corner/edge target commits on ONE click, and `ui.layout_config.confirm_placements: true` opts into an arm-then-Confirm for games where a misplacement is expensive.
- **Lua is not Python.** `else:` / `then:` / `if:` with a trailing colon are syntax errors.
- Never write files to disk expecting the platform to pick them up: the game record is the source of truth, so use `update_game`.
- Never commit your `PANDYA_API_KEY` token.
