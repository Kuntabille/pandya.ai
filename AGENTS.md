# AGENTS.md

## What this repo is
A **public**, distributable AI-assistant plugin for authoring games on pandya.ai. It is NOT application source. It ships:
- `skills/pandya-authoring/SKILL.md` — the game-authoring skill (agent workflow + MCP tools). The single source of truth for the skill content.
- `npm/` — the public mirror of `@pandya/skill`, the dependency-free Node package whose CLI installs the skill into an AI coding assistant (Claude Code, Cursor, Gemini/Antigravity, OpenCode). Built in a private repo, mirrored here (see below).
- `mcp.json` — points an MCP client at the public MCP server `https://pandya.ai/mcp/sse`. There is no local MCP server; ignore stale "pandya.ai/mcp" references.
- `plugin.json` — manifest for git-clone-based plugin loaders.
- `docs/` — Jekyll site deployed to GitHub Pages on push to `main` (`.github/workflows/pages.yml`).

There is **no SDK and no compiled CLI in this repo.** The platform surface is the public MCP server plus this skill. If you find yourself wanting a `dist/cli.js` or an `@pandya/sdk`, you are looking at history, not the current design.

## Public-repo policy — read this before adding anything
This repository is world-readable. It must not describe or link to the internals of the server implementation.

- **No internal source references.** Do not write file paths, package names, service names, struct names, or sibling-repository names belonging to the backend — no `internal/...`, no `*.go`, no proto packages, no "see the other repo". Not in prose, not in code comments, not in commit messages.
- **Ground truth is the public MCP server.** `get_authoring_guidelines`, `get_lua_libraries` and `get_ui_components` return the current contract. To check whether something is true, call the tool — never reach for a private path or a vendored snapshot.
- **No build inputs.** Never commit server source, build scripts, or configuration that describes internal topology.
- Prefer a sentence that is true without naming an internal. "The engine enforces validation at publish time" carries the same information as pointing at the exact module and file that does the validating — minus the map to the codebase.
- **Never commit credentials.** MCP tokens and local agent state are git-ignored (`.opencode.json`, `.opencode/`, `.pandya-token`). Keep it that way.

## The skill package (`npm/`) — a public mirror
The `@pandya/skill` package is **built and published from a private development repository**, not here. The `npm/` directory in this repo is a **read-only public mirror** of the built artifact — present for transparency, not as a build location.

Mirrored files:
- `npm/bin/cli.js` — the zero-dependency installer. `npx @pandya/skill` prompts for targets; `--target`, `--scope`, `--dir`, `--force`, `--dry-run` make it non-interactive. Subcommands: `install` (default), `mcp`, `list`.
- `npm/skill/SKILL.md` — the skill bundled into the published package (a snapshot of the same content as `skills/pandya-authoring/SKILL.md`).
- `npm/package.json` — mirrored with **no `scripts` and no `repository`/`homepage` fields**; that is deliberate, so this repo carries no build inputs and names no private repository.
- `npm/README.md` — the package readme.

Rules:
- **Do not add build scripts, a `repository`/`homepage` field, or source here.** A change belongs in the private source, then gets re-mirrored.
- **Do not introduce backend internals** in the mirror or its readme (see the public-repo policy above).
- To update the mirror: rebuild + publish in the private repo, then copy `bin/cli.js`, `package.json`, `README.md` and the skill snapshot across, and bump `version` to match.
- `skills/pandya-authoring/SKILL.md` and `npm/skill/SKILL.md` both mirror the same private skill source — refresh them together. Verify with `diff npm/skill/SKILL.md skills/pandya-authoring/SKILL.md`.

## Pandya game authoring (skill workflow)
A game is three files in a project dir: `canvas.json` (board layout plus the GDL `actions` contract), `logic.lua` (the rules), and `INSTRUCTIONS.md` (the player-facing "How to Play" manual). Workflow: canvas → logic → instructions, then validate with the MCP tools before committing. `skills/pandya-authoring/SKILL.md` is the source of truth for this workflow.

## MCP tools
Ten tools are exposed by the public MCP server: `create_game`, `validate_logic_and_canvas`, `simulate_game_logic`, `get_lua_libraries`, `get_ui_components`, `get_authoring_guidelines`, `update_game`, `simulate_gameplay`, `get_game`, `get_playtest_logs`. `get_lua_libraries` returns the Lua library signatures — the engine hooks and the module APIs — and nothing else. There is no `validate_game_code` and no `scaffold_game`; older docs used those names, so don't re-introduce them. Confirm the current list with `tools/list` on the server rather than trusting this file.

## Lua engine API
Hooks: `setup(players)`, `get_actions()` → list of `{id,name,type}` tables, `on_move(player_index, action_id, move_table)` → `(accepted, reason)`, `check_win()` → `{winner=n}` / `{draw=true}` / `nil`. Modules exposed as globals: `board.*`, `game.*`, `piece.*`, `util.*`, `campaign.*`, `paths.*`, plus `GAME_VARIATIONS` / `has_variation`. The move table carries `action_id`, `piece_id`, `target_cell`, `target_piece_id`, `from`, plus flat props. The `ctx.*` / `ctx.state.vars` API that still appears in parts of the served docs is legacy and inaccurate — use the signatures above.

## Gotchas
- `component.tsx` is **gone and must not come back.** It is not one of the three game files, the board renders from `canvas.json` via a precompiled renderer, and the platform has no field for per-game UI code.
- **Keep the skill single-sourced.** Skill prose lives only in `skills/pandya-authoring/SKILL.md`. The packaged `npm/skill/SKILL.md` is a committed snapshot of the same content — refresh them together, and never hand-edit a copy. Duplicating the same prose by hand is exactly the drift trap this replaced: the copies had drifted into advertising tools that do not exist.
- Per-game React authoring guidance is gone and shouldn't return. The platform's board renderer does use React, but authors do not write a React component — keep those two claims separate. `get_ui_components` still returns React primitives because it serves the platform's own renderer.
- Docs `index.md` links broke before (missing DEVELOPER_GUIDE.md); keep doc links pointed at files that exist.
