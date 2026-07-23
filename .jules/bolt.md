## 2024-05-24 - Avoid Sync I/O in Async Functions
**Learning:** Using synchronous I/O functions like `fs.readFileSync` and `fs.existsSync` inside an `async` function blocks the Node.js event loop, preventing concurrent requests from being processed while the file system operations complete.
**Action:** Always use `fs.promises` for file system operations in async functions. For reading multiple independent files, use `Promise.all` to execute reads concurrently, further reducing execution time.
