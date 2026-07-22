## 2024-05-18 - Avoid Sync I/O in SDK Async Functions
**Learning:** Found widespread use of `fs.readFileSync` and `fs.existsSync` inside asynchronous functions in the SDK. This is an anti-pattern as it blocks the Node.js event loop unnecessarily.
**Action:** Always prefer `fs.promises.readFile` in `async` functions, and combine concurrent reads with `Promise.all` to reduce overall I/O time. Avoid `fs.existsSync` as a separate check to prevent extra syscalls and race conditions; handle `ENOENT` directly in `try/catch` around `readFile`.
