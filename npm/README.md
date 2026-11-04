# @pandya.ai/skill

Installs the **pandya-authoring** skill into your AI coding assistant so it
knows how to build games on [pandya.ai](https://pandya.ai) and how to use the
Pandya MCP tools.

A pandya game is four files: `canvas.json` (the GDL board layout and `actions`
contract), `logic.lua` (the rules), `scenarios.json` (executable rule scenarios
the validator runs in the real engine), and `INSTRUCTIONS.md` (the player-facing
manual). The skill teaches your assistant that workflow and the Lua engine API.

## Usage

```bash
# Interactive: pick your assistant(s)
npx @pandya.ai/skill

# Or target explicitly
npx @pandya.ai/skill install --target claude,cursor
npx @pandya.ai/skill install --target all --scope project
```

Supported targets: `claude` (Claude Code), `cursor`, `gemini`
(Gemini / Antigravity), `opencode`.

### Options

| Flag | Description |
| --- | --- |
| `--target <list>` | Comma-separated targets, or `all`. Skips the prompt. |
| `--scope <s>` | `global` (default) or `project`. Cursor is always project-scoped. |
| `--dir <path>` | Write to a custom directory (single target only). |
| `--force` | Overwrite an existing skill file. |
| `--dry-run` | Print what would be written without writing. |

## Connect the MCP server

The skill is only the workflow; the tools live on the Pandya MCP server.

| | |
| --- | --- |
| Endpoint | `https://pandya.ai/mcp` (streamable HTTP) |
| SSE-only clients | `https://pandya.ai/mcp/sse` |
| Auth | OAuth 2.1 — interactive clients sign in through the browser, nothing to paste |

```bash
# Claude Code
claude mcp add --transport http pandya https://pandya.ai/mcp

# Codex CLI: ~/.codex/config.toml
#   [mcp_servers.pandya]
#   url = "https://pandya.ai/mcp"

# OpenCode: opencode.json (note mcp.servers, not mcp)
#   {"mcp":{"servers":{"pandya":{"type":"remote","url":"https://pandya.ai/mcp"}}}}

# Anything that only speaks stdio (incl. Claude Desktop builds without connectors)
npx -y mcp-remote https://pandya.ai/mcp
```

Cursor, VS Code, Gemini CLI, Antigravity, Windsurf and a non-interactive
`Authorization: Bearer` path are documented in the plugin repository's
[README](https://github.com/Kuntabille/pandya.ai#2-connect-the-mcp-server).

Run `npx @pandya.ai/skill mcp` for the snippets, and `npx @pandya.ai/skill list` for
where the skill is installed.

### Other commands

```bash
npx @pandya.ai/skill list     # show targets and default destinations
npx @pandya.ai/skill mcp      # print MCP server config snippets
```

## Where the skill is installed

| Target | Destination |
| --- | --- |
| Claude Code | `~/.claude/skills/pandya-authoring/SKILL.md` (or `./.claude/...` with `--scope project`) |
| Cursor | `./.cursor/rules/pandya-authoring.mdc` |
| Gemini / Antigravity | `~/.gemini/config/plugins/pandya/skills/pandya-authoring/SKILL.md` |
| OpenCode | `~/.config/opencode/skills/pandya-authoring/SKILL.md` (or `./.opencode/skills/...`) |

## Connect the MCP server

Installing the skill only provides context. To let your assistant actually
create, validate, and simulate games, connect the Pandya MCP server:

```json
{ "mcpServers": { "pandya": { "url": "https://pandya.ai/mcp/sse" } } }
```

Then authenticate with a token from **pandya.ai → Profile → Developer Settings**
(`PANDYA_API_KEY`). Run `npx @pandya.ai/skill mcp` for per-assistant commands.

## Development & release

This directory is the **source** of the published `@pandya.ai/skill` package. The
skill it ships is not maintained here: `npm/skill/SKILL.md` is a snapshot of the
canonical [`skills/pandya-authoring/SKILL.md`](../../skills/pandya-authoring/SKILL.md),
regenerated — and staleness-checked — by `make authoring-build` together with the
editor plugin copies under `plugins/`. Edit the canonical skill, then run
`make authoring-build` to refresh every derived copy (including this snapshot).

Releases are tag-driven and run in CI; there is deliberately no local
`npm publish` (a version on the registry cannot be unpublished and reissued, and
CI is the only place the token lives):

```bash
# bump "version" in npm/package.json, commit, then:
git tag skill-v0.2.0 && git push origin skill-v0.2.0
```

`.github/workflows/publish-skill.yml` verifies the tag matches the version and
publishes with the `NPM_TOKEN` secret. The public mirror repository carries the
built package (`bin/cli.js`, `package.json`, `README.md`, `skill/SKILL.md`) for
transparency.

## Uninstall

Remove the skill directory you installed to, e.g.:

```bash
rm -rf ~/.claude/skills/pandya-authoring
rm -rf ~/.config/opencode/skills/pandya-authoring
rm -rf ~/.gemini/config/plugins/pandya
```
