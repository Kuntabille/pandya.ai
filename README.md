# Pandya Game Authoring Agent Plugin

This repository is the official AI-assistant plugin for **[pandya.ai](https://pandya.ai)**.
It gives your AI coding assistant (Claude Code, Cursor, Gemini/Antigravity, OpenCode, Windsurf, Claude Desktop, …)
the context and the **MCP tools** it needs to author, validate, and publish games on the platform.

There is no SDK to install. Everything runs through the public MCP server plus a
single **skill** file that teaches your assistant the authoring workflow.

**[Installation guide →](https://kuntabille.github.io/pandya.ai/)** — the same steps
below, with copy-ready config for each client.

---

## What's in here

| Path | What it is |
| --- | --- |
| `skills/pandya-authoring/SKILL.md` | The game-authoring skill — the agent workflow and MCP tool usage. |
| `npm/` | `@pandya.ai/skill` — a Node package that installs the skill into your assistant. |
| `mcp.json` | MCP client config pointing at `https://pandya.ai/mcp`. |
| `plugin.json` | Manifest for git-clone-based plugin loaders. |
| `docs/` | Documentation site. |

---

## 🚀 Install

### 1. Install the skill

```bash
npx @pandya.ai/skill
```

It prompts for which assistant(s) to install into. To skip the prompt:

```bash
npx @pandya.ai/skill install --target claude,cursor,gemini,opencode
npx @pandya.ai/skill install --target all --scope project
```

Targets: `claude` (Claude Code), `cursor`, `gemini` (Gemini / Antigravity), `opencode`.

| Target | Installed to |
| --- | --- |
| Claude Code | `~/.claude/skills/pandya-authoring/SKILL.md` (or `./.claude/...` with `--scope project`) |
| Cursor | `./.cursor/rules/pandya-authoring.mdc` |
| Gemini / Antigravity | `~/.gemini/config/plugins/pandya/skills/pandya-authoring/SKILL.md` |
| OpenCode | `~/.config/opencode/skills/pandya-authoring/SKILL.md` (or `./.opencode/skills/...`) |

`npx @pandya.ai/skill list` shows every target and its destination;
`npx @pandya.ai/skill install --help` documents the flags (`--scope`, `--dir`,
`--force`, `--dry-run`).

### 2. Connect the MCP server

The skill teaches the workflow; the MCP server does the work — create, fetch,
validate, simulate, update, publish.

| | |
| --- | --- |
| **Endpoint** | `https://pandya.ai/mcp` (streamable HTTP) |
| **SSE-only clients** | `https://pandya.ai/mcp/sse` |
| **Auth** | OAuth 2.1 — interactive clients sign in through the browser, nothing to paste |

An unauthenticated request answers with a `WWW-Authenticate` challenge pointing
at `https://pandya.ai/.well-known/oauth-protected-resource/mcp`, which is how an
OAuth-capable client discovers the flow. Sign in once; the client keeps the
token.

#### Claude Code

```bash
claude mcp add --transport http pandya https://pandya.ai/mcp
claude mcp list              # verify: pandya … connected
```

Project-scoped (shared with the repo, checked in): `claude mcp add --scope project …`,
which writes `.mcp.json`:

```json
{ "mcpServers": { "pandya": { "type": "http", "url": "https://pandya.ai/mcp" } } }
```

#### Claude Desktop

**Settings → Connectors → Add custom connector**, name `pandya`, URL
`https://pandya.ai/mcp`, then connect and sign in. Builds that predate
Connectors only load stdio servers — use the [stdio bridge](#stdio-only-clients)
below.

#### Cursor

**Settings → MCP → Add new MCP server** (type *remote* / *streamable HTTP*),
URL `https://pandya.ai/mcp`. Or check in `.cursor/mcp.json`:

```json
{ "mcpServers": { "pandya": { "url": "https://pandya.ai/mcp" } } }
```

#### VS Code (Copilot agent mode)

`.vscode/mcp.json`, then **MCP: List Servers → start pandya**:

```json
{ "servers": { "pandya": { "type": "http", "url": "https://pandya.ai/mcp" } } }
```

#### Gemini CLI

`~/.gemini/settings.json` (or the project equivalent), then restart:

```json
{ "mcpServers": { "pandya": { "httpUrl": "https://pandya.ai/mcp" } } }
```

#### Antigravity

**MCP panel → Add remote server**, URL `https://pandya.ai/mcp`. The
[git-clone plugin](#git-clone-plugin-loaders-gemini--antigravity) below is an
alternative for the Gemini/Antigravity plugin loader.

#### OpenCode

`opencode.json` (project root, or `~/.config/opencode/opencode.json` globally).
Note the `mcp.servers` nesting — a server placed directly under `mcp` is ignored:

```json
{
  "mcp": {
    "servers": {
      "pandya": { "type": "remote", "url": "https://pandya.ai/mcp" }
    }
  }
}
```

#### Codex CLI

`~/.codex/config.toml`:

```toml
[mcp_servers.pandya]
url = "https://pandya.ai/mcp"
# Headless only (see below): read the token from the environment.
# bearer_token_env_var = "PANDYA_API_KEY"
```

#### Windsurf

**MCP settings** (or `~/.codeium/windsurf/mcp_config.json`); remote servers use
`serverUrl`:

```json
{ "mcpServers": { "pandya": { "serverUrl": "https://pandya.ai/mcp" } } }
```

#### Anything else

Any client that accepts a **remote MCP server URL** can use
`https://pandya.ai/mcp`. If a client only supports local (stdio) servers, or you
use one whose MCP config we have not verified (Pi, Hermes, and similar
assistants), point it at the bridge below.

#### stdio-only clients

```bash
npx -y mcp-remote https://pandya.ai/mcp
```

`mcp-remote` proxies a remote MCP server over stdio and performs the OAuth
sign-in on first run. For a non-interactive environment, pass a Bearer token
instead of the browser flow:

```bash
npx -y mcp-remote https://pandya.ai/mcp \
  --header "Authorization: Bearer $PANDYA_API_KEY"
```

#### Verify

Ask the assistant to call **`get_authoring_guidelines`** — it should return the
Canvas and Logic authoring prompts. If it instead reports the server as
unavailable, the client did not follow the OAuth challenge; check the URL and
the client version.

Run `npx @pandya.ai/skill mcp` to print these snippets at any time.

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

- `create_game` — scaffold a new pandya.ai draft game (`canvas.json`, `logic.lua`, `scenarios.json`, `INSTRUCTIONS.md`) from a name and description.
- `get_authoring_guidelines` — the comprehensive authoring prompts (Canvas / Lua rules).
- `get_lua_libraries` — the Lua engine reference (hooks, APIs, guidelines).
- `get_ui_components` — the React UI primitives and GDL Theme Catalog presets used by the platform renderer.
- `validate_logic_and_canvas` — validate `logic.lua` and `canvas.json` against engine contracts; pass `scenarios_json` to execute your rule scenarios too.
- `simulate_game_logic` — run the Lua VM headlessly to catch runtime errors.
- `simulate_gameplay` — run an end-to-end browser simulation of UI + logic.
- `update_game` — update a draft game's `canvas.json`, `logic.lua`, `scenarios.json` or `INSTRUCTIONS.md` by `game_id`. Validation runs on the merged state, scenarios included, so a failing scenario rejects the write.
- `get_game` — fetch an existing game's content by `game_id`.
- `get_playtest_logs` — fetch execution logs for a live playtest session.

## 🔐 Authenticating with Pandya

**Interactive clients need no setup.** The server advertises OAuth 2.1 through
the `WWW-Authenticate` challenge on `https://pandya.ai/mcp`; your assistant opens
a browser, you sign in, and the client stores the grant. Grants can be reviewed
and revoked at **pandya.ai → Profile → Developer → Connected applications**.

**Non-interactive agents** (CI, cron, an orchestrator, a stdio bridge in a
container) cannot complete that browser flow, so they use a Bearer token:

1. Mint a `pandya_mcp_…` token with your session. There is no button for this in
   the profile today; call the API directly:

   ```bash
   curl -s https://pandya.ai/user.UserService/GenerateMCPToken \
     -H "Authorization: Bearer $PANDYA_SESSION_JWT" \
     -H "Content-Type: application/json" -H "Connect-Protocol-Version: 1" \
     -d '{"name":"ci-agent","expiresInDays":90}'
   ```

   The raw token is returned once; only its hash is stored.
2. Provide it to the client as `PANDYA_API_KEY`, or as the header
   `Authorization: Bearer $PANDYA_API_KEY` (the shell examples above use that
   variable).

Existing `pandya_mcp_…` tokens keep working; new integrations should prefer
OAuth.

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
