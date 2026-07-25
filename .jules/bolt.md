## 2026-07-25 - Replaced synchronous file read in push.ts
**Learning:** The Pandya game packaging script was blocking the Node.js event loop by reading large Lua logic scripts and React component trees using `fs.readFileSync`.
**Action:** Always replace blocking `readFileSync` with concurrent `Promise.all([fs.promises.readFile(...)])` to speed up CLI execution and prevent main thread freezes.
