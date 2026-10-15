# @pandya/skill

Installs the **pandya-authoring** skill into your AI coding assistant so it
knows how to build games on [pandya.ai](https://pandya.ai) and how to use the
Pandya MCP tools.

A pandya game is three files: `canvas.json` (the GDL board layout and `actions`
contract), `logic.lua` (the rules), and `INSTRUCTIONS.md` (the player-facing
manual). The skill teaches your assistant that workflow and the Lua engine API.

## Usage

```bash
# Interactive: pick your assistant(s)
npx @pandya/skill

# Or target explicitly
npx @pandya/skill install --target claude,cursor
npx @pandya/skill install --target all --scope project
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

### Other commands

```bash
npx @pandya/skill list     # show targets and default destinations
npx @pandya/skill mcp      # print MCP server config snippets
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
(`PANDYA_API_KEY`). Run `npx @pandya/skill mcp` for per-assistant commands.

## Source of truth

This directory is a **read-only public mirror** of the published `@pandya/skill`
package. The package is built and published from a private development
repository; the files here (`bin/cli.js`, `package.json`, `skill/SKILL.md`,
`README.md`) are copied from the built artifact. There are deliberately no build
scripts and no `repository` field in the mirrored `package.json`.

The skill text also mirrors
[`skills/pandya-authoring/SKILL.md`](https://github.com/Kuntabille/pandya.ai/blob/main/skills/pandya-authoring/SKILL.md);
the two are refreshed together from the same private source.

## Uninstall

Remove the skill directory you installed to, e.g.:

```bash
rm -rf ~/.claude/skills/pandya-authoring
rm -rf ~/.config/opencode/skills/pandya-authoring
rm -rf ~/.gemini/config/plugins/pandya
```
