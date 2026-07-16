## 2024-07-16 - [CLI Boot Time Optimization]
**Learning:** Top-level imports of heavy modules (like `express`, `axios`, `adm-zip`) in CLI tools significantly degrade boot time for simple commands like `--help`.
**Action:** Use dynamic imports (`await import()`) inside commander action handlers to lazily load dependencies only when a specific command is executed.
