#!/usr/bin/env node
// pandya-skill — install the pandya.ai game-authoring skill into your AI
// coding assistant. No dependencies; Node >= 18.
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { constants as FS } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import process from "node:process";
import * as readline from "node:readline/promises";

const MCP_URL = "https://pandya.ai/mcp/sse";

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(pkgRoot, "..");

// ---------------------------------------------------------------------------
// Skill content
// ---------------------------------------------------------------------------

// Prefer the copy bundled at pack time; fall back to the repo checkout so the
// CLI works from a git clone before the package is built.
async function loadSkill() {
  const candidates = [
    path.join(pkgRoot, "skill", "SKILL.md"),
    path.join(repoRoot, "skills", "pandya-authoring", "SKILL.md"),
  ];
  for (const file of candidates) {
    try {
      return { text: await readFile(file, "utf8"), file };
    } catch {
      /* try next */
    }
  }
  throw new Error(
    "could not locate SKILL.md (looked in: " + candidates.join(", ") + ")",
  );
}

function splitFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!m) return { frontmatter: null, body: text };
  return { frontmatter: m[1], body: text.slice(m[0].length) };
}

function frontmatterValue(frontmatter, key) {
  if (!frontmatter) return null;
  const m = new RegExp(`^${key}:\\s*(.+)$`, "m").exec(frontmatter);
  return m ? m[1].trim() : null;
}

// Cursor uses `.mdc` rules with its own frontmatter shape.
function toCursorRule(skillText) {
  const { frontmatter, body } = splitFrontmatter(skillText);
  const description =
    frontmatterValue(frontmatter, "description") ||
    "Context and tools for building games on pandya.ai";
  return `---\ndescription: ${description}\nglobs:\nalwaysApply: false\n---\n${body.trimStart()}`;
}

// ---------------------------------------------------------------------------
// Targets
// ---------------------------------------------------------------------------

const TARGETS = {
  claude: {
    label: "Claude Code",
    scopeNote: "global ~/.claude/skills/, project ./.claude/skills/",
    dest: ({ scope, home, cwd }) =>
      path.join(
        scope === "project" ? path.join(cwd, ".claude") : path.join(home, ".claude"),
        "skills",
        "pandya-authoring",
        "SKILL.md",
      ),
    mcp: "claude mcp add pandya --url " + MCP_URL,
  },
  cursor: {
    label: "Cursor",
    scopeNote: "project ./.cursor/rules/ (Cursor rules are project-scoped)",
    dest: ({ cwd }) =>
      path.join(cwd, ".cursor", "rules", "pandya-authoring.mdc"),
    transform: toCursorRule,
    mcp: `Cursor Settings → Features → MCP Servers → add an SSE server for ${MCP_URL}`,
  },
  gemini: {
    label: "Gemini / Antigravity",
    scopeNote:
      "global ~/.gemini/config/plugins/pandya/skills/, project ./.gemini/config/plugins/pandya/skills/",
    dest: ({ scope, home, cwd }) =>
      path.join(
        scope === "project" ? path.join(cwd, ".gemini") : path.join(home, ".gemini"),
        "config",
        "plugins",
        "pandya",
        "skills",
        "pandya-authoring",
        "SKILL.md",
      ),
    mcp: "agy mcp add pandya --url " + MCP_URL,
  },
  opencode: {
    label: "OpenCode",
    scopeNote: "global ~/.config/opencode/skills/, project ./.opencode/skills/",
    dest: ({ scope, home, cwd }) =>
      path.join(
        scope === "project"
          ? path.join(cwd, ".opencode")
          : path.join(home, ".config", "opencode"),
        "skills",
        "pandya-authoring",
        "SKILL.md",
      ),
    mcp:
      `add to opencode.json:\n  {"mcp":{"pandya":{"type":"remote","url":"${MCP_URL}","headers":{"Authorization":"Bearer $PANDYA_API_KEY"}}}}`,
  },
};

const TARGET_KEYS = Object.keys(TARGETS);

function tilde(p) {
  const home = os.homedir();
  return p.startsWith(home) ? "~" + p.slice(home.length) : p;
}

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { _: [], flags: new Map() };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") {
      args._.push(...argv.slice(i + 1));
      break;
    }
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      if (eq !== -1) {
        args.flags.set(a.slice(2, eq), a.slice(eq + 1));
      } else {
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith("-")) {
          args.flags.set(a.slice(2), next);
          i++;
        } else {
          args.flags.set(a.slice(2), true);
        }
      }
    } else if (a.startsWith("-") && a.length > 1) {
      args.flags.set(a.slice(1), true);
    } else {
      args._.push(a);
    }
  }
  return args;
}

const HELP = `pandya-skill — install the pandya.ai game-authoring skill

Usage:
  npx @pandya/skill [install] [options]
  npx @pandya/skill mcp [--target <list>]
  npx @pandya/skill list

Options:
  --target <list>   Comma-separated targets (or "all"). Skips the prompt.
                    Targets: ${TARGET_KEYS.join(", ")}
  --scope <s>       global | project (default: global; Cursor is always project)
  --dir <path>      Override the destination directory (single target only)
  --force           Overwrite an existing skill file
  --dry-run         Show what would be written without writing
  -h, --help        Show this help
  -v, --version     Show the package version

After installing, wire up the MCP server (see \`pandya-skill mcp\`) so your
assistant can call the pandya.ai authoring tools.
`;

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function selectTargets(flags) {
  const raw = flags.get("target");
  if (raw) {
    const names = String(raw)
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (names.includes("all")) return TARGET_KEYS.slice();
    const bad = names.filter((n) => !TARGETS[n]);
    if (bad.length) throw new Error(`unknown target(s): ${bad.join(", ")}`);
    return TARGET_KEYS.filter((k) => names.includes(k));
  }
  if (!process.stdin.isTTY) {
    throw new Error(
      `no --target given and stdin is not a TTY; pass --target <list> (${TARGET_KEYS.join(", ")})`,
    );
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    console.log("Which assistant(s) should I install the pandya-authoring skill into?\n");
    TARGET_KEYS.forEach((k, i) => {
      console.log(`  ${i + 1}) ${TARGETS[k].label}  (${TARGETS[k].scopeNote})`);
    });
    console.log("  a) all\n");
    const answer = (await rl.question("Select (numbers/names, comma-separated) [all]: ")).trim();
    if (!answer || answer.toLowerCase() === "a" || answer.toLowerCase() === "all") {
      return TARGET_KEYS.slice();
    }
    const picked = new Set();
    for (const token of answer.split(/[,\s]+/).filter(Boolean)) {
      const n = Number(token);
      if (Number.isInteger(n) && n >= 1 && n <= TARGET_KEYS.length) {
        picked.add(TARGET_KEYS[n - 1]);
      } else if (TARGETS[token.toLowerCase()]) {
        picked.add(token.toLowerCase());
      } else {
        throw new Error(`unrecognized selection: ${token}`);
      }
    }
    if (!picked.size) throw new Error("no targets selected");
    return TARGET_KEYS.filter((k) => picked.has(k));
  } finally {
    rl.close();
  }
}

async function exists(p) {
  try {
    await access(p, FS.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function cmdInstall(args) {
  const { flags } = args;
  const scope = String(flags.get("scope") || "global").toLowerCase();
  if (!["global", "project"].includes(scope)) {
    throw new Error(`--scope must be global or project, got: ${scope}`);
  }
  const force = Boolean(flags.get("force"));
  const dryRun = Boolean(flags.get("dry-run"));
  const dirOverride = flags.get("dir") ? path.resolve(String(flags.get("dir"))) : null;

  const targets = await selectTargets(flags);
  if (dirOverride && targets.length > 1) {
    throw new Error("--dir can only be used with a single --target");
  }

  const skill = await loadSkill();
  const home = os.homedir();
  const cwd = process.cwd();

  console.log(`\nInstalling pandya-authoring skill → ${targets.length} target(s)\n`);
  let written = 0;

  for (const key of targets) {
    const target = TARGETS[key];
    const content = target.transform ? target.transform(skill.text) : skill.text;
    const dest = dirOverride
      ? path.join(dirOverride, path.basename(target.dest({ scope, home, cwd })))
      : target.dest({ scope, home, cwd });

    if (await exists(dest)) {
      const current = await readFile(dest, "utf8");
      if (current === content) {
        console.log(`  ✓ ${target.label.padEnd(22)} ${tilde(dest)} (already up to date)`);
        continue;
      }
      if (!force) {
        console.log(`  ! ${target.label.padEnd(22)} ${tilde(dest)} exists and differs — re-run with --force`);
        continue;
      }
    }

    if (dryRun) {
      console.log(`  → ${target.label.padEnd(22)} would write ${tilde(dest)}`);
      continue;
    }

    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, content, "utf8");
    written++;
    console.log(`  ✓ ${target.label.padEnd(22)} ${tilde(dest)}`);
  }

  if (!dryRun) {
    console.log(`\nDone. ${written} file(s) written.`);
  }
  printMcpHint(targets);
}

function printMcpHint(targets) {
  console.log("\nNext: connect the pandya.ai MCP server so the skill can call its tools.");
  for (const key of targets) {
    console.log(`  ${TARGETS[key].label}: ${TARGETS[key].mcp}`);
  }
  console.log(
    "\nAuthenticate with a PANDYA_API_KEY token from pandya.ai → Profile → Developer Settings.",
  );
  console.log("Run `pandya-skill mcp` for the raw config snippets.");
}

async function cmdMcp(args) {
  const targets = args.flags.get("target")
    ? await selectTargets(args.flags)
    : TARGET_KEYS.slice();
  console.log("\nPandya MCP server configuration\n");
  console.log("Generic mcpServers entry:");
  console.log(
    JSON.stringify({ mcpServers: { pandya: { url: MCP_URL } } }, null, 2),
  );
  console.log("\nPer assistant:");
  for (const key of targets) {
    console.log(`  ${TARGETS[key].label}: ${TARGETS[key].mcp}`);
  }
  console.log(
    "\nSet PANDYA_API_KEY (or paste the token when prompted) to authenticate.",
  );
}

function cmdList() {
  console.log("\nAvailable install targets\n");
  const home = os.homedir();
  const cwd = process.cwd();
  for (const key of TARGET_KEYS) {
    const t = TARGETS[key];
    console.log(`  ${key.padEnd(10)} ${t.label}`);
    console.log(`             ${t.scopeNote}`);
    console.log(`             → ${tilde(t.dest({ scope: "global", home, cwd }))}`);
  }
  console.log("");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0] || "install";

  if (args.flags.has("help") || args.flags.has("h") || command === "help") {
    console.log(HELP);
    return;
  }
  if (args.flags.has("version") || args.flags.has("v") || command === "version") {
    const pkg = JSON.parse(await readFile(path.join(pkgRoot, "package.json"), "utf8"));
    console.log(pkg.version);
    return;
  }

  switch (command) {
    case "install":
      return cmdInstall(args);
    case "mcp":
      return cmdMcp(args);
    case "list":
      return cmdList();
    default:
      console.error(`unknown command: ${command}\n`);
      console.log(HELP);
      process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(`\npandya-skill: ${err.message}`);
  process.exitCode = 1;
});
