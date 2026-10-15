# Pandya Game Authoring Agent Plugin

This repository is the official AI-assistant plugin for **[pandya.ai](https://pandya.ai)**.
It gives your AI coding assistant (Claude Code, Cursor, Gemini/Antigravity, OpenCode, Windsurf, Claude Desktop, …)
the context and the **MCP tools** it needs to author, validate, and publish games on the platform.

There is no SDK to install. Everything runs through the public MCP server plus a
single **skill** file that teaches your assistant the authoring workflow.

---

## What's in here

| Path | What it is |
| --- | --- |
| `skills/pandya-authoring/SKILL.md` | The game-authoring skill — the agent workflow and MCP tool usage. |
| `npm/` | `@pandya/skill` — a Node package that installs the skill into your assistant. |
| `mcp.json` | MCP client config pointing at `https://pandya.ai/mcp/sse`. |
| `plugin.json` | Manifest for git-clone-based plugin loaders. |
| `docs/` | Documentation site. |

---

## 🚀 Install

### 1. Install the skill

```bash
npx @pandya/skill
```

It prompts for which assistant(s) to install into. To skip the prompt:

```bash
npx @pandya/skill install --target claude,cursor,gemini,opencode
npx @pandya/skill install --target all --scope project
```

Targets: `claude` (Claude Code), `cursor`, `gemini` (Gemini / Antigravity), `opencode`.

| Target | Installed to |
| --- | --- |
| Claude Code | `~/.claude/skills/pandya-authoring/SKILL.md` (or `./.claude/...` with `--scope project`) |
| Cursor | `./.cursor/rules/pandya-authoring.mdc` |
| Gemini / Antigravity | `~/.gemini/config/plugins/pandya/skills/pandya-authoring/SKILL.md` |
| OpenCode | `~/.config/opencode/skills/pandya-authoring/SKILL.md` (or `./.opencode/skills/...`) |

`npx @pandya/skill list` shows every target and its destination;
`npx @pandya/skill install --help` documents the flags (`--scope`, `--dir`,
`--force`, `--dry-run`).

### 2. Connect the MCP server

The skill needs the Pandya MCP server to actually create, validate, and simulate
games. Point your assistant at the SSE endpoint `https://pandya.ai/mcp/sse`.

Add this to your assistant's MCP config:

```json
{
  "mcpServers": {
    "pandya": {
      "url": "https://pandya.ai/mcp/sse"
    }
  }
}
```

Or use the per-assistant command:

```bash
# Claude Code
claude mcp add pandya --url https://pandya.ai/mcp/sse

# Antigravity / Gemini CLI
agy mcp add pandya --url https://pandya.ai/mcp/sse
```

- **Cursor**: Settings → Features → MCP Servers → add an **SSE** server for `https://pandya.ai/mcp/sse`.
- **Windsurf**: add the SSE server `https://pandya.ai/mcp/sse` in MCP settings.
- **Claude Desktop**: add the `mcpServers` entry above to `claude_desktop_config.json` and restart.
- **OpenCode**: add to `opencode.json`:
  ```json
  {
    "mcp": {
      "pandya": {
        "type": "remote",
        "url": "https://pandya.ai/mcp/sse",
        "headers": { "Authorization": "Bearer $PANDYA_API_KEY" }
      }
    }
  }
  ```

Run `npx @pandya/skill mcp` to print these snippets at any time.

### Git-clone plugin loaders (Gemini / Antigravity)

Some tools load plugins from a git checkout instead of npm. Clone this repo into
the plugin directory and the skill + `mcp.json` are picked up automatically:

```bash
git clone https://github.com/Kuntabille/pandya.ai.git ~/.gemini/config/plugins/pandya
```

Restart the tool afterwards.

---

## 🛠 Available MCP Tools

Once connected, your AI agent has access to:

- `create_game` — scaffold a new pandya.ai draft game (`canvas.json`, `logic.lua`, `INSTRUCTIONS.md`) from a name and description.
- `get_authoring_guidelines` — the comprehensive authoring prompts (Canvas / Lua rules).
- `get_lua_libraries` — the Lua engine reference (hooks, APIs, guidelines).
- `get_ui_components` — the React UI primitives and GDL Theme Catalog presets used by the platform renderer.
- `validate_logic_and_canvas` — statically validate `logic.lua` and `canvas.json` against engine contracts.
- `simulate_game_logic` — run the Lua VM headlessly to catch runtime errors.
- `simulate_gameplay` — run an end-to-end browser simulation of UI + logic.
- `update_game` — update an existing game's content by `game_id`.
- `get_game` — fetch an existing game's content by `game_id`.
- `get_playtest_logs` — fetch execution logs for a live playtest session.

## 🔐 Authenticating with Pandya

MCP access is granted through a token, so your assistant can call the tools on
your behalf.

1. **Log in** at [pandya.ai](https://pandya.ai).
2. Go to **Profile / Account Settings → Developer Settings (MCP Tokens)**.
3. Generate a token (name it, pick an expiry) and copy the raw value immediately — it is shown once.
4. Provide it to your assistant:
   - **Environment variable** `PANDYA_API_KEY` (recommended), or
   - paste it when your assistant prompts for authentication.

## 🗑️ Uninstall / Disable

**Remove the skill** — delete the directory it was installed to:

```bash
rm -rf ~/.claude/skills/pandya-authoring
rm -rf ~/.config/opencode/skills/pandya-authoring
rm -rf ~/.gemini/config/plugins/pandya
rm -rf .cursor/rules/pandya-authoring.mdc
```

**Remove the MCP server** — `claude mcp remove pandya`, `agy mcp remove pandya`,
or delete the `pandya` entry from your MCP config and restart.

---

Enjoy building your games autonomously on Pandya!
