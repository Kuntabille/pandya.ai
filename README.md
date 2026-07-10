# Pandya Game Authoring Agent Plugin

This repository provides the official AI Assistant plugin for **pandya.ai**. 
It supplies your AI coding assistant (Gemini, Claude, Cursor, Windsurf, etc.) with the context and MCP (Model Context Protocol) tools necessary to automatically generate and validate game logic, GDL (Canvas JSON), and React UI components.

---

## 🚀 Installation Instructions

Depending on your AI coding assistant, follow the instructions below to install this plugin and connect to the Pandya backend.

### 1. Google Gemini / Antigravity (AGY CLI & AGY IDE)
Gemini natively supports Git-based plugins. You can install this plugin directly by cloning it into your global Gemini plugins directory:

```bash
# Clone this repository into your Gemini config
git clone https://github.com/Kuntabille/pandya.ai.git ~/.gemini/config/plugins/pandya
```
*Restart Gemini/Antigravity after running this command. The plugin will be automatically loaded, exposing the `pandya-authoring` skill and the Pandya MCP tools.*

**For Antigravity CLI (`agy`):**
Because the plugin includes an `mcp.json` file, the MCP tools will be automatically loaded when you restart the CLI. You can also manually add it using the command:
```bash
agy mcp add pandya --url https://pandya.ai/mcp/sse
```

**For Antigravity IDE:**
You can also manually configure the MCP server through the IDE settings:
1. Open the Antigravity IDE settings (gear icon or `Cmd/Ctrl + ,`).
2. Navigate to the **MCP Servers** section.
3. Click to add a new server.
4. Set the type to **SSE** and enter the URL: `https://pandya.ai/mcp/sse`.

---

### 2. Claude Desktop (Anthropic)
Claude Desktop supports standard MCP configurations. You need to add our SSE MCP server to your Claude configuration.

1. Open your Claude Desktop configuration file:
   - **Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
2. Add the `pandya` server to the `mcpServers` object:

```json
{
  "mcpServers": {
    "pandya": {
      "url": "https://pandya.ai/mcp/sse"
    }
  }
}
```
3. Restart Claude Desktop. The Pandya tools will now be available (look for the hammer/tools icon).
4. **Important Context**: To give Claude the right context, copy the contents of `skills/pandya-authoring/SKILL.md` and paste it into a Project's custom instructions, or simply attach it to your first prompt.

---

### 3. Cursor
Cursor supports adding MCP servers natively through the settings UI.

1. Open **Cursor Settings** -> **Features** -> **MCP Servers**.
2. Click **+ Add new MCP server**.
3. Configure it as follows:
   - **Name**: `pandya`
   - **Type**: `SSE`
   - **URL**: `https://pandya.ai/mcp/sse`
4. **Important Context**: Copy the contents of `skills/pandya-authoring/SKILL.md` and save it as a `.cursorrules` file in the root of your game project. This ensures Cursor knows how to use the tools effectively.

---

### 4. Windsurf
Windsurf supports adding MCP servers natively via its UI or config file.

1. Add the MCP server in Windsurf's settings pointing to the SSE URL: `https://pandya.ai/mcp/sse`.
2. **Important Context**: Copy the contents of `skills/pandya-authoring/SKILL.md` and save it as `.windsurfrules` (or use the Global Rules settings) so the AI agent understands the Pandya architecture.

---

### 5. Claude Code (CLI)
If you use Anthropic's terminal-based `claude-code`, you can configure it via the CLI:
```bash
claude mcp add pandya --url https://pandya.ai/mcp/sse
```
*You can also point it to the `mcp.json` included in this repository.*

---

## 🛠 Available MCP Tools
Once installed, your AI agent will have access to the following server-side tools:
- `validate_game_code`: Statically validates that the React components and Lua scripts match contracts.
- `simulate_game_logic`: Runs the Lua VM headlessly to check for runtime errors.
- `get_lua_libraries`: Returns available Lua hooks.
- `get_ui_components`: Returns available React primitives.
- `get_authoring_guidelines`: Retrieves the comprehensive system prompts for generating the Canvas JSON, Lua Logic, and React UI.
- `scaffold_game`: Scaffolds a new pandya.ai game in the specified directory.
- `update_game`: Updates an existing pandya.ai game's local files in the specified directory.

## 🔐 Authenticating with Pandya for MCP Usage
To use the MCP tools, your AI assistant needs to authenticate with the Pandya website. We use specific MCP Tokens to grant strict, rate-limited access to the `/mcp/sse` endpoints.

1. **Log In**: Navigate to [pandya.ai](https://pandya.ai) in your browser and log into your account.
2. **Navigate to Developer Settings**: Go to your **Profile / Account Settings** and find the **Developer Settings (MCP Tokens)** section.
3. **Generate a Token**: Enter a token name (e.g., "VS Code Agent" or "Claude Desktop"), choose an expiration duration (e.g., 30 days), and click **Generate**. *Note: You must copy the raw token immediately as it will not be shown again.*
4. **Configure Your Assistant**:
   - **Environment Variable**: Set an environment variable (e.g., `PANDYA_API_KEY = your_raw_token_here`) in your assistant's environment settings.
   - **Prompt-based Auth**: If the assistant prompts you for authentication during the first tool invocation, simply paste the generated token when requested.

## 🗑️ Uninstalling / Disabling MCP

If you wish to remove or disable the Pandya MCP tools:
- **Gemini / Antigravity**: Delete the cloned plugin directory (`rm -rf ~/.gemini/config/plugins/pandya`). If you added the MCP manually via CLI, run `agy mcp remove pandya`. For the IDE, remove the server from the **MCP Servers** settings.
- **Claude Desktop**: Open your `claude_desktop_config.json` file and remove the `"pandya"` entry from the `"mcpServers"` object, then restart Claude.
- **Cursor**: Go to **Cursor Settings** -> **Features** -> **MCP Servers** and delete the `pandya` server.
- **Windsurf**: Remove the server from your MCP Server settings.
- **Claude Code (CLI)**: Run the command `claude mcp remove pandya`.

## 📦 Uninstalling the SDK

If you have installed the Pandya CLI/SDK globally via npm, you can uninstall it by running:
```bash
npm uninstall -g pandya
```
If you installed it as a project dependency, remove it from your project:
```bash
npm uninstall pandya
# or
yarn remove pandya
```

Enjoy building your games autonomously on Pandya!
