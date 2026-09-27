# AGENTS.md

## What this repo is
A **public**, distributable AI-assistant plugin for authoring games on pandya.ai. It is NOT application source. It ships:
- `skills/pandya-authoring/SKILL.md` — the game-authoring skill (agent workflow + MCP tools).
- `mcp.json` — points an MCP client at the public MCP server `https://pandya.ai/mcp/sse`. There is no local MCP server; ignore stale "pandya.ai/mcp" references.
- `sdk/` — the **compiled** `@pandya/sdk` package (`dist/cli.js`). Its source is not in this repo.
- `docs/` — Jekyll site deployed to GitHub Pages on push to `main` (`.github/workflows/pages.yml`).

## Public-repo policy — read this before adding anything
This repository is world-readable. It must not describe or link to the internals of the server implementation.

- **No internal source references.** Do not write file paths, package names, service names, struct names, or sibling-repository names belonging to the backend — no `internal/...`, no `*.go`, no proto packages, no "see the other repo". Not in prose, not in code comments, not in commit messages.
- **Ground truth is the public MCP server**, not a private checkout. `get_authoring_guidelines`, `get_lua_libraries` and `get_ui_components` return the current contract, and `sdk/guidelines.*` / `sdk/lua_libs.*` in this repo are snapshots of exactly those responses. To check whether something is true, call the tool or read the snapshot — never reach for a private path.
- **No build inputs.** Only compiled output is committed (see the SDK section). Never commit server source, build scripts, or configuration that describes internal topology.
- Prefer a sentence that is true without naming an internal. "The engine enforces validation at publish time" carries the same information as "the validator in `internal/gameauthor/validator.go` enforces validation", minus the map to the codebase.
- **One known, deliberate exception:** `sdk/dist/cli.js` contains the literal string `gameauthor.GameAuthorService/<Method>`. That is the public HTTPS route the CLI POSTs to, not a source reference, and a shipped SDK cannot call the API without it. It is inherited from the build — do not try to strip it from the bundle, and do not introduce new occurrences by hand-editing `dist/`.

## How the SDK gets here: build → publish → commit
The authoring workflow and the CLI's source code are maintained in a separate, private repository. **This repo is a publish target for the CLI, not its development location** — the same arrangement a vendor uses when they ship a compiled binary in their public repo.

1. Change the CLI in the private repository (TypeScript, under its `sdk/src`).
2. Build it there: `tsup src/cli.ts --format cjs --minify`, driven by the `build` script in that repo's `sdk/package.json`.
3. Publish the npm package from that repository.
4. Copy the built `dist/cli.js` and `dist/cli.d.ts` into this repo's `sdk/dist/`, and bump the version in this repo's `sdk/package.json`.

Consequences of that split, all deliberate:
- `sdk/dist/` is committed even though it is generated, because npm consumers install the package and never see the private repo — the compiled artifact has to be present here.
- There is **no** `build` script in this repo's `sdk/package.json` (`scripts` is just `start`), and there must not be one. If you want to rebuild in place, you are in the wrong repository.
- **Never hand-edit `sdk/dist/cli.js`.** It is minified output; any patch is lost on the next build. Fix the source, rebuild, copy.
- The bundle externalizes `adm-zip`, `axios`, `commander`, `express` and `open`. All are declared in `dependencies`, so `npm install` is required before the CLI will run.

## Pandya game authoring (skill workflow)
A game is three files in a project dir: `canvas.json` (board layout plus the GDL `actions` contract), `logic.lua` (the rules), and `INSTRUCTIONS.md` (the player-facing "How to Play" manual). Workflow: canvas → logic → instructions, then validate with the MCP tools before committing. `skills/pandya-authoring/SKILL.md` is the source of truth for this workflow.

## MCP tools
Ten tools are exposed by the public MCP server: `create_game`, `validate_logic_and_canvas`, `simulate_game_logic`, `get_lua_libraries`, `get_ui_components`, `get_authoring_guidelines`, `update_game`, `simulate_gameplay`, `get_game`, `get_playtest_logs`. There is no `validate_game_code` and no `scaffold_game`; older docs used those names, so don't re-introduce them. Confirm the current list with `tools/list` on the server rather than trusting this file.

## Lua engine API
Hooks: `setup(players)`, `get_actions()` → list of `{id,name,type}` tables, `on_move(player_index, action_id, move_table)` → `(accepted, reason)`, `check_win()` → `{winner=n}` / `{draw=true}` / `nil`. Modules exposed as globals: `board.*`, `game.*`, `piece.*`, `util.*`, `campaign.*`, `paths.*`, plus `GAME_VARIATIONS` / `has_variation`. The move table carries `action_id`, `piece_id`, `target_cell`, `target_piece_id`, `from`, plus flat props. The `ctx.*` / `ctx.state.vars` API that still appears in parts of the served docs is legacy and inaccurate — use the signatures above.

## Gotchas
- `component.tsx` is **gone and must not come back.** It is not one of the three game files, the board renders from `canvas.json` via a precompiled renderer, and the platform has no field for per-game UI code. `pandya init` scaffolds only `logic.lua` + `canvas.json`; `push` and `package` require and archive only those two. If you hit a `component.tsx` requirement, you are looking at an out-of-date `dist/`, not a real constraint.
- `pandya login` writes the OAuth token to `./.pandya-token` in the **current working directory**. It is gitignored; keep it that way, and keep `docs/SDK_GUIDE.md` from claiming otherwise. (Auth env var is `PANDYA_API_KEY`.)
- Skill content is triplicated: `sdk/PANDYA_INSTRUCTIONS.md` and `sdk/.cursorrules` must stay consistent with `skills/pandya-authoring/SKILL.md`. The two packaged copies are byte-identical; `SKILL.md` is the same content plus a 4-line YAML frontmatter. Verify with `diff <(tail -n +5 skills/pandya-authoring/SKILL.md) sdk/PANDYA_INSTRUCTIONS.md`.
- `sdk/guidelines.{json,txt}` and `sdk/lua_libs.{json,txt}` are snapshots of the MCP responses. Each `.json` holds the byte-identical payload of its `.txt` twin inside a `content[0].text` CallToolResult wrapper — regenerate both together or they drift. Because they mirror a **public** server response, any correction belongs in the docs that server serves first; editing only the mirror diverges it, and the next verbatim resync re-imports the error.
- **Known stale content in those snapshots:** the `ctx.*` Lua examples and some retired tool names (`validate_game_code`, `scaffold_game`, `on_setup`, `check_win_condition`, `on_turn_end`, `on_phase_change`, `generate_instructions`). Hand-pruning them here does not converge — the earlier partial pass removed 217 of 268 lines and still drifted, so don't extend it. Fix the served docs instead.
- Per-game React authoring guidance is gone and shouldn't return. The platform's board renderer does use React, but authors do not write a React component — keep those two claims separate. `get_ui_components` still returns React primitives because it serves the platform's own renderer.
- docs `index.md` links broke before (missing DEVELOPER_GUIDE.md); keep doc links pointed at files that exist.
