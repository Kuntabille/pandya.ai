# AGENTS.md

## What this repo is
A distributable AI-assistant **plugin** for authoring games on pandya.ai — it is NOT application source. It ships:
- `skills/pandya-authoring/SKILL.md` — the game-authoring skill (agent workflow + MCP tools).
- `mcp.json` — points an MCP client at the remote server `https://pandya.ai/mcp/sse` (no local MCP server; ignore stale "pandya.ai/mcp" references).
- `sdk/` — a prebuilt Node CLI (`dist/cli.js`, published as `@pandya/sdk`).
- `docs/` — Jekyll site deployed to GitHub Pages on push to `main` (`.github/workflows/pages.yml`).

The backend + MCP server source lives in the sibling repo at `../pandya.dev` (Go). It is the ground truth for the MCP tool list, the Lua engine API, and the docs the MCP tools serve.

## Pandya game authoring (skill workflow)
A game is three files in a project dir: `canvas.json` (Canvas GDL layout), `logic.lua` (state machine: `setup`, `get_actions`, `on_move`, `check_win`), and `INSTRUCTIONS.md` (the player-facing "How to Play" manual). Workflow: canvas → logic → instructions, then validate with MCP tools (`validate_logic_and_canvas`, `simulate_game_logic`) before committing. `skills/pandya-authoring/SKILL.md` is the source of truth for this workflow.

## MCP tools (truth = `../pandya.dev/internal/mcp/server.go`)
Ten tools are registered: `create_game`, `validate_logic_and_canvas`, `simulate_game_logic`, `get_lua_libraries`, `get_ui_components`, `get_authoring_guidelines`, `update_game`, `simulate_gameplay`, `get_game`, `get_playtest_logs`. There is NO `validate_game_code` or `scaffold_game` — older docs/AGENTS versions used those names; don't re-introduce them.

## Lua engine API (truth = `../pandya.dev/internal/gameauthor/luaengine/{engine.go,hostapi.go}`)
Hooks: `setup(players)`, `get_actions()` → list of `{id,name,type}` tables, `on_move(player_index, action_id, move_table)` → `(accepted, reason)`, `check_win()` → `{winner=n}` / `{draw=true}` / `nil`. Modules exposed as globals: `board.*`, `game.*`, `piece.*`, `util.*`, `campaign.*`, `paths.*` plus `GAME_VARIATIONS`/`has_variation`. The move table carries `action_id`, `piece_id`, `target_cell`, `target_piece_id`, `from`, plus flat props. The `ctx.*` / `ctx.state.vars` API shown in the served docs is legacy/inaccurate.

## SDK CLI (truth = `sdk/dist/cli.js`)
Only five commands exist: `login`, `init`, `push`, `package`, `upload`. There is **no** build/test/lint tooling — `package.json` has no `build` script. `dist/` is committed; edit source + rebuild is not possible here. (Current CLI TypeScript source lives at `../pandya.dev/sdk/src`, package name `pandya.ai`; our `@pandya/sdk` dist is an older prebuilt snapshot.)

Typical flow: `sdk` → `npm install` → `npm link`; then `pandya login`, `pandya init .`, edit game files, `pandya push <GAME_UUID>`.

## Gotchas
- `component.tsx` is **gone and must not come back**. It is not one of the three game files, the board renders from `canvas.json` via the precompiled `CustomGameBoard`, and the field that carried it (`ui_component_code`) no longer exists in `api/proto/` or `gen/`. Nothing in `internal/game/` or `internal/lobby/` reads it. The one leftover: the prebuilt `sdk/dist/cli.js` still checks that the file *exists* and aborts `push`/`package`/`upload` with "Missing required files" otherwise — so leave the stub that `pandya init` writes alone rather than authoring one. Dropping that check belongs in `../pandya.dev/sdk/src`, which is where the CLI source actually lives.
- `pandya login` writes the OAuth token to `./.pandya-token` in the **current working directory**. It is in `.gitignore`; keep it that way, and keep `docs/SDK_GUIDE.md` from claiming otherwise. (Auth env var is `PANDYA_API_KEY`.)
- Skill content is duplicated in `sdk/PANDYA_INSTRUCTIONS.md` (npm-packaged copy, keep in sync) and `sdk/.cursorrules` — all three should stay consistent with SKILL.md. The two packaged copies are byte-identical; `SKILL.md` is the same content plus a 4-line YAML frontmatter. Verify with `diff <(tail -n +5 skills/pandya-authoring/SKILL.md) sdk/PANDYA_INSTRUCTIONS.md`.
- `sdk/guidelines.{json,txt}` and `sdk/lua_libs.{json,txt}` are vendored snapshots of what the MCP tools `get_authoring_guidelines` / `get_lua_libraries` actually serve (`../pandya.dev/docs/AUTHORING_GUIDELINES.md` / `INTERNAL_ENGINE.md`). Each `.json` holds the byte-identical payload of its `.txt` twin inside a `content[0].text` CallToolResult wrapper — regenerate both together or they drift. Resync them from the backend files when those change; see the residue note below before attempting a resync.
- **Known residue, do not try to hand-fix it here.** These snapshots still contain stale `ctx.*` Lua examples (`ctx.state`, `ctx.random`, `ctx.end_turn`, `ctx.current_player`, `ctx.log`) and dead tool/hook names (`on_setup`, `check_win_condition`, `validate_game_code`, `scaffold_game`, `validate_ui_components`, `on_turn_end`, `on_phase_change`, `generate_instructions`, `internal/engine`). The *backend* docs still carry one occurrence each, so a verbatim resync re-imports them. The residue has to be deleted in `../pandya.dev/docs/` first; only then does copying the files here converge. The 2026-09 pass deleted 217/268 lines here by hand and got partway — that approach does not converge, so don't extend it.
- The `pandya login` scaffold in `sdk/dist/cli.js` emits `on_move(action_id, player, payload)` — the real engine calls `on_move(player_index, action_id, move_table)`. Don't copy that signature; prefer SKILL.md.
- docs `index.md` links broke before (missing DEVELOPER_GUIDE.md); keep doc links pointed at files that exist.
